import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { assignSalesRep } from '../services/sales/assignSalesRep';
import { quotationService } from '../services/sales/quotation.service';
import { convertQuotationToOrderService } from '../services/sales/convertQuotationToOrder.service';
import { generateReference, REFERENCE_CATEGORY } from '../utils/reference';
import { userRepository } from '../repositories';
import { env } from '../config/env';

const router = Router();

// GET /api/quotations (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quotation.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List quotations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations (admin create walk-in lead)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.create({ data: req.body });
    res.status(201).json(quotation);
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
    });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    res.json(quotation);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id/prior-inquiries (other quotations sharing this
// quotation's phone number — UC-01 dedupe visibility)
router.get('/:id/prior-inquiries', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }

    const priorInquiries = await prisma.quotation.findMany({
      where: { phoneNumber: quotation.phoneNumber, id: { not: quotation.id } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, vehicleModel: true, status: true, createdAt: true },
    });

    res.json(priorInquiries);
  } catch (error) {
    console.error('Get prior inquiries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/quotations/:id (admin update)
router.put('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.update({ where: { id: req.params.id }, data: req.body });
    res.json(quotation);
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quotations/:id (admin delete)
router.delete('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.quotation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/send-quotation (email the generated quotation PDF
// to the customer — gated on manager approval, per Quotation.
// managerApprovalStatus's doc comment: "a generated quotation cannot be sent
// to the customer until a manager approves it here")
router.post('/:id/send-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    if (quotation.managerApprovalStatus !== 'APPROVED') {
      res.status(400).json({ error: 'This quotation must be approved by a manager before it can be sent.' });
      return;
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'sent' },
    });

    let notificationSent = false;
    if (quotation.email) {
      const link = quotation.reference ? `${env.urls.site}/quotation/${encodeURIComponent(quotation.reference)}` : undefined;
      const result = await dispatchNotification({
        type: 'quotation',
        to: [quotation.email],
        subject: `Your Quotation${quotation.reference ? ` (${quotation.reference})` : ''}`,
        data: {
          quotationId: quotation.id,
          quotationNo: quotation.reference,
          customerName: quotation.customerName,
          vehicleModel: quotation.vehicleModel,
          ...(link && { link }),
        },
      });
      notificationSent = result.ok;
    }

    res.json({ ...updated, notificationSent });
  } catch (error) {
    console.error('Send quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/reject-quotation (manager returns a generated
// quotation for correction — this is the manager-approval-status reject,
// same gate QuotationApprovalPanel.tsx surfaces, not a customer-facing
// rejection: the customer never sees a quotation until it's sent).
router.post('/:id/reject-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    if (!reason) { res.status(400).json({ error: 'A rejection reason is required.' }); return; }

    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        managerApprovalStatus: 'REJECTED',
        managerRejectedById: req.adminSession!.user.id,
        managerRejectedAt: new Date(),
        managerRejectionReason: reason,
      },
    });
    res.json(quotation);
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id/quotation-pdf (view PDF) — Quotation has no stored
// pdfUrl; the PDF is generated on demand (see quotationPdf.service.ts). The
// closest thing to a persisted document link is signedDocumentUrl once the
// customer has actually signed (same convention as public.routes.ts's
// GET /quotations/:reference/pdf).
router.get('/:id/quotation-pdf', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    res.json({ quotation, pdfUrl: quotation.signedDocumentUrl });
  } catch (error) {
    console.error('Get quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/quotation-pdf (generate/regenerate the Sales
// Quotation — see QuotationPdfPanel.tsx for the real request body shape and
// the manager-approval reset-on-regenerate behavior).
router.post('/:id/quotation-pdf', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }

    const { unitPrice, quantity, discountAmount, vehicleYear, vehicleColor, quotationValidUntil, paymentTerms, deliveryTerms } = req.body;
    const parsedUnitPrice = unitPrice != null && unitPrice !== '' ? Number(unitPrice) : null;
    if (parsedUnitPrice == null || Number.isNaN(parsedUnitPrice)) {
      res.status(400).json({ error: 'unitPrice is required' });
      return;
    }
    const parsedQuantity = quantity != null && quantity !== '' ? Number(quantity) : 1;
    const parsedDiscount = discountAmount != null && discountAmount !== '' ? Number(discountAmount) : 0;
    // VAT is calculated automatically at 15% of the vehicle price minus discount (per QuotationPdfPanel.tsx).
    const vatAmount = Math.max(0, parsedUnitPrice * parsedQuantity - parsedDiscount) * 0.15;

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        unitPrice: parsedUnitPrice,
        quantity: parsedQuantity,
        discountAmount: parsedDiscount,
        vatAmount,
        vehicleYear: vehicleYear || null,
        vehicleColor: vehicleColor || null,
        paymentTerms: paymentTerms || null,
        deliveryTerms: deliveryTerms || null,
        quotationValidUntil: quotationValidUntil ? new Date(quotationValidUntil) : null,
        quotationNo: quotation.quotationNo || (await generateReference(REFERENCE_CATEGORY.QUOTATION)),
        quotationGeneratedAt: new Date(),
        // Rejecting resets to PENDING once the agent regenerates a corrected
        // quotation (see Quotation.managerApprovalStatus's doc comment).
        managerApprovalStatus: 'PENDING',
        managerRejectedById: null,
        managerRejectedAt: null,
        managerRejectionReason: null,
      },
    });

    res.json({ quotation: updated, pdfUrl: null });
  } catch (error) {
    console.error('Generate quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/escalate (escalate to manager)
router.post('/:id/escalate', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Quotation not found' }); return; }

    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        status: 'escalated',
        escalatedAt: new Date(),
        escalatedById: req.adminSession!.user.id,
        escalatedFrom: existing.assignedTo,
        escalationReason: req.body.reason,
      },
    });
    // TODO: Send email notification to new assignee and manager
    res.json(quotation);
  } catch (error) {
    console.error('Escalate quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/check-overdue-escalations (check and auto-escalate overdue)
router.post('/check-overdue-escalations', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await quotationService.checkOverdueEscalations();
    res.json(result);
  } catch (error) {
    console.error('Check overdue escalations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/convert-to-order (convert to sales order)
router.post('/:id/convert-to-order', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await convertQuotationToOrderService.convert(req.params.id, req.body?.assignedTo);
    if (!result.ok) {
      res.status(result.error === 'Quotation not found.' ? 404 : 400).json({ error: result.error });
      return;
    }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Convert quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/approve-quotation (manager approves the generated
// quotation — sets the manager sign-off gate, not the general lifecycle
// `status`; see QuotationApprovalPanel.tsx).
router.post('/:id/approve-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        managerApprovalStatus: 'APPROVED',
        managerApprovedById: req.adminSession!.user.id,
        managerApprovedAt: new Date(),
      },
    });
    res.json(quotation);
  } catch (error) {
    console.error('Approve quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/submit (public - submit lead quotation)
router.post('/submit', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { autoAssign, assignmentFactors, ...body } = req.body;
    const quotation = await prisma.quotation.create({ data: body });

    // Auto-assign sales representative if requested
    let assignedRep = null;
    if (autoAssign) {
      const assignResult = await assignSalesRep({
        targetType: 'quotation',
        targetId: quotation.id,
        autoAssign: true,
        factors: assignmentFactors,
      });
      if (assignResult.ok && assignResult.data) {
        assignedRep = assignResult.data;
        // Update the quotation with the assigned rep
        await prisma.quotation.update({
          where: { id: quotation.id },
          data: { assignedTo: assignResult.data.userId },
        });
      }
    }

    res.status(201).json({ success: true, reference: quotation.reference, assignedRep });
  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/assign-rep (assign or reassign sales rep)
router.post('/:id/assign-rep', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { autoAssign, salesRepName, salesRepId, assignmentFactors } = req.body;
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }

    const result = await assignSalesRep({
      targetType: 'quotation',
      targetId: req.params.id,
      salesRepName,
      salesRepId,
      autoAssign,
      factors: assignmentFactors,
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    // Send email notification to the assigned rep and manager
    const assignedRep = await userRepository.findById(result.data!.userId);
    if (assignedRep?.email) {
      await dispatchNotification({
        type: 'lead_assignment',
        to: [assignedRep.email, 'manager@geelyethiopia.com'],
        subject: `New Quotation Assignment${quotation.reference ? ` (${quotation.reference})` : ''}`,
        data: {
          quotationId: quotation.id,
          quotationNo: quotation.reference,
          customerName: quotation.customerName,
          phoneNumber: quotation.phoneNumber,
          vehicleModel: quotation.vehicleModel,
          assignedTo: assignedRep.name,
        },
      });
    }

    res.json({ success: true, assignedRep: result.data, error: result.error });
  } catch (error) {
    console.error('Assign rep error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as quotationRoutes };
