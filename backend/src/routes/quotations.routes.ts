import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { sendQuotationConfirmationEmail } from '../services/email/statusEmail';
import { assignSalesRep } from '../services/sales/assignSalesRep';
import { quotationService } from '../services/sales/quotation.service';
import { convertQuotationToOrderService } from '../services/sales/convertQuotationToOrder.service';
import { quotationPdfService } from '../services/sales/quotationPdf.service';
import { generateReference, REFERENCE_CATEGORY } from '../utils/reference';
import { userRepository } from '../repositories';
import { env } from '../config/env';

const router = Router();

let cachedManagerEmails: string[] | null = null;
let managerEmailsCachedAt = 0;
const MANAGER_EMAIL_CACHE_TTL = 5 * 60 * 1000;

async function getManagerEmails(): Promise<string[]> {
  const now = Date.now();
  if (cachedManagerEmails && now - managerEmailsCachedAt < MANAGER_EMAIL_CACHE_TTL) {
    return cachedManagerEmails;
  }
  cachedManagerEmails = await userRepository.findManagerEmails();
  managerEmailsCachedAt = now;
  return cachedManagerEmails;
}

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

    // NOTE: this used to return `{ items, total, page, pageSize, totalPages }`
    // with no `stats` at all — but QuotationsList.tsx reads `data.quotations`
    // and `data.stats` (matching the working OrdersList.tsx/orders.routes.ts
    // pair's `{ orders, stats, total }` shape). Since neither key existed,
    // `setQuotations(undefined)` ran on every load, the `!quotations` render
    // guard (initial state `null`) never cleared, and the page was stuck on
    // "Loading quotations…" permanently for every user, every time — not an
    // intermittent failure, a 100%-reproducible one. `stats` is computed
    // unfiltered (independent of the current search/status filter) so the
    // tab badge counts reflect the whole table, matching the orders list's
    // behavior.
    const [quotations, total, statusCounts] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quotation.count({ where }),
      prisma.quotation.groupBy({ by: ['status'], _count: true }),
    ]);

    const counts: Record<string, number> = {};
    for (const row of statusCounts) counts[row.status] = row._count;
    const stats = {
      total: statusCounts.reduce((sum, row) => sum + row._count, 0),
      new: counts['new'] || 0,
      contacted: counts['contacted'] || 0,
      approved: counts['approved'] || 0,
      accepted: counts['accepted'] || 0,
      converted: counts['converted'] || 0,
      closed: counts['closed'] || 0,
    };

    res.json({ quotations, stats, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
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
    let notificationError: string | undefined;
    if (quotation.email) {
      const link = quotation.reference ? `${env.urls.site}/quotation/${encodeURIComponent(quotation.reference)}` : undefined;

      // Generate PDF attachment
      const pdfResult = await quotationPdfService.generatePdf(quotation.id);
      const attachments = pdfResult.ok && pdfResult.data
        ? [{ filename: `quotation-${quotation.reference || quotation.id}.pdf`, content: pdfResult.data, contentType: 'application/pdf' }]
        : undefined;

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
        attachments,
      });
      notificationSent = result.ok;
      notificationError = result.error;
    } else {
      notificationError = 'This quotation has no email address on file for the customer.';
    }

    res.json({ ...updated, notificationSent, notificationError });
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

    // Step 4: Notify the assigned sales agent that the quotation was rejected
    const assignedAgent = quotation.assignedTo ? await userRepository.findById(quotation.assignedTo) : null;
    if (assignedAgent?.email) {
      await dispatchNotification({
        type: 'lead_assignment',
        to: [assignedAgent.email],
        subject: `Quotation Returned for Correction${quotation.reference ? ` (${quotation.reference})` : ''}`,
        data: {
          quotationId: quotation.id,
          quotationNo: quotation.reference,
          customerName: quotation.customerName,
          vehicleModel: quotation.vehicleModel,
          reason,
          nextStep: 'Please review the feedback, correct the quotation, and resubmit for approval.',
          adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
        },
        inApp: {
          type: 'quotation_rejected',
          title: 'Quotation Returned for Correction',
          body: `Hello ${assignedAgent.name}, quotation ${quotation.reference || ''} for ${quotation.customerName} has been returned for correction. Reason: ${reason}. Please review, correct, and resubmit.`,
          link: `/admin/quotations/${quotation.id}`,
          quotationId: quotation.id,
          relatedModel: 'quotation',
          relatedId: quotation.id,
          priority: 'high',
        },
      });
    }

    res.json(quotation);
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id/quotation-pdf (view PDF) — serves the stored PDF
// if available, otherwise generates on-demand.
router.get('/:id/quotation-pdf', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    // Check if a stored PDF exists
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id }, select: { pdfUrl: true } });
    if (quotation?.pdfUrl) {
      const result = await quotationPdfService.generatePdf(req.params.id);
      if (result.ok && result.data) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="quotation-${req.params.id}.pdf"`);
        res.send(result.data);
        return;
      }
    }

    const result = await quotationPdfService.generatePdf(req.params.id);
    if (!result.ok || !result.data) {
      res.status(404).json({ error: result.error || 'Quotation not found or not generated yet.' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quotation-${req.params.id}.pdf"`);
    res.send(result.data);
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

    const {
      unitPrice, quantity, discountAmount, vehicleYear, vehicleColor, quotationValidUntil, paymentTerms, deliveryTerms,
      // New Sales Quotation format fields (Kerchanshe Trading PLC draft) — see QuotationPdfPanel.tsx.
      salesType, salesExecutiveName, customerTin, customerAddress, vehicleVariant, vehicleVin,
      registrationCharge, registrationResponsibility, insuranceResponsibility, chargingEquipmentDetails,
      depositAmount, depositDueDate, balanceDueDate, deliveryLocation, expectedHandoverNote,
    } = req.body;
    const parsedUnitPrice = unitPrice != null && unitPrice !== '' ? Number(unitPrice) : null;
    if (parsedUnitPrice == null || Number.isNaN(parsedUnitPrice)) {
      res.status(400).json({ error: 'unitPrice is required' });
      return;
    }
    const parsedQuantity = quantity != null && quantity !== '' ? Number(quantity) : 1;
    const parsedDiscount = discountAmount != null && discountAmount !== '' ? Number(discountAmount) : 0;
    const parsedRegistrationCharge = registrationCharge != null && registrationCharge !== '' ? Number(registrationCharge) : null;
    const parsedDepositAmount = depositAmount != null && depositAmount !== '' ? Number(depositAmount) : null;
    // VAT is calculated automatically at 15% of the vehicle price minus discount (per QuotationPdfPanel.tsx).
    const vatAmount = Math.max(0, parsedUnitPrice * parsedQuantity - parsedDiscount) * 0.15;
    const assignedAgent = quotation.assignedTo
      ? await userRepository.findById(quotation.assignedTo)
      : null;

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
        salesType: salesType || null,
        salesExecutiveName: assignedAgent?.name || null,
        customerTin: customerTin || null,
        customerAddress: customerAddress || null,
        vehicleVariant: vehicleVariant || null,
        vehicleVin: vehicleVin || null,
        registrationCharge: parsedRegistrationCharge,
        registrationResponsibility: registrationResponsibility || null,
        insuranceResponsibility: insuranceResponsibility || null,
        chargingEquipmentDetails: chargingEquipmentDetails || null,
        depositAmount: parsedDepositAmount,
        depositDueDate: depositDueDate ? new Date(depositDueDate) : null,
        balanceDueDate: balanceDueDate ? new Date(balanceDueDate) : null,
        deliveryLocation: deliveryLocation || null,
        expectedHandoverNote: expectedHandoverNote || null,
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

    // Step 3: Notify manager that a quotation is ready for review/approval
    const managerEmails = await getManagerEmails();
    await dispatchNotification({
      type: 'lead_assignment',
      to: managerEmails,
      subject: `Quotation Pricing Submitted — Review Required${quotation.reference ? ` (${quotation.reference})` : ''}`,
      data: {
        quotationId: quotation.id,
        quotationNo: updated.quotationNo || quotation.reference,
        customerName: quotation.customerName,
        vehicleModel: quotation.vehicleModel,
        totalPrice: `${parsedUnitPrice} × ${parsedQuantity} - ${parsedDiscount} + ${vatAmount}`,
        salesAgent: assignedAgent?.name || 'Unassigned',
        nextStep: 'Review the pricing and approve or reject the quotation.',
        adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
      },
      inApp: {
        type: 'approval_required',
        title: 'Quotation Needs Your Approval',
        body: `A quotation for ${quotation.customerName}${quotation.vehicleModel ? ` (${quotation.vehicleModel})` : ''} has been submitted by ${assignedAgent?.name || 'a sales agent'} and requires your review and approval.`,
        link: `/admin/quotations/${quotation.id}`,
        quotationId: quotation.id,
        relatedModel: 'quotation',
        relatedId: quotation.id,
        priority: 'high',
      },
    });

    // Generate PDF and persist it for consistent viewing/signing
    const pdfResult = await quotationPdfService.generatePdf(updated.id);

    res.json({ quotation: updated, pdfUrl: pdfResult.ok ? `/api/quotations/${updated.id}/quotation-pdf` : null });
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

    // Send email notification to the new assignee and manager
    if (quotation.assignedTo) {
      const assignedUser = await userRepository.findById(quotation.assignedTo);
      if (assignedUser?.email) {
        const managerEmails = await getManagerEmails();
        await dispatchNotification({
          type: 'lead_assignment',
          to: [assignedUser.email, ...managerEmails],
          subject: `Quotation Escalated — Reassigned to You${quotation.reference ? ` (${quotation.reference})` : ''}`,
          data: {
            quotationId: quotation.id,
            quotationNo: quotation.reference,
            customerName: quotation.customerName,
            vehicleModel: quotation.vehicleModel,
            reason: req.body.reason || 'Escalated by manager',
            nextStep: 'Please contact the customer as soon as possible.',
            adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
          },
          inApp: {
            type: 'lead_assignment',
            title: 'Quotation Escalated to You',
            body: `Hello ${assignedUser.name}, quotation ${quotation.reference || ''} for ${quotation.customerName} has been escalated to you. ${req.body.reason || 'Please contact the customer as soon as possible.'}`,
            link: `/admin/quotations/${quotation.id}`,
            quotationId: quotation.id,
            relatedModel: 'quotation',
            relatedId: quotation.id,
            priority: 'urgent',
          },
        });
      }
    }

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
// `status`; see QuotationApprovalPanel.tsx). Also handles discount
// approvals where managerApprovalStatus is PENDING_DISCOUNT.
router.post('/:id/approve-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }

    // Look up the manager's staff signature to embed in the PDF
    const manager = await userRepository.findByIdSlim(req.adminSession!.user.id);
    const managerSignatureUrl = manager?.signatureUrl ?? null;

    // Handle discount approval if pending
    if (quotation.managerApprovalStatus === 'PENDING_DISCOUNT') {
      const discountPercent = quotation.discountAmount;
      // Manager is approving the discount - mark as approved
      const updated = await prisma.quotation.update({
        where: { id: req.params.id },
        data: {
          managerApprovalStatus: 'APPROVED',
          managerApprovedById: req.adminSession!.user.id,
          managerApprovedAt: new Date(),
          managerSignatureUrl,
        },
      });

      // Regenerate PDF so it includes the manager's signature
      await quotationPdfService.generatePdf(req.params.id);

      // Notify the assigned sales agent that the discount was approved
      const assignedAgent = quotation.assignedTo ? await userRepository.findById(quotation.assignedTo) : null;
      if (assignedAgent?.email) {
        await dispatchNotification({
          type: 'lead_assignment',
          to: [assignedAgent.email],
          subject: `Discount Approved — Quotation Ready to Send${quotation.reference ? ` (${quotation.reference})` : ''}`,
          data: {
            quotationId: quotation.id,
            quotationNo: quotation.reference,
            customerName: quotation.customerName,
            vehicleModel: quotation.vehicleModel,
            nextStep: 'The discount has been approved. Please review the quotation and send it to the customer.',
            adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
          },
          inApp: {
            type: 'quotation_approved',
            title: 'Discount Approved',
            body: `Hello ${assignedAgent.name}, the discount for quotation ${quotation.reference || ''} (${quotation.customerName}) has been approved. You can now send the quotation to the customer.`,
            link: `/admin/quotations/${quotation.id}`,
            quotationId: quotation.id,
            relatedModel: 'quotation',
            relatedId: quotation.id,
            priority: 'normal',
          },
        });
      }

      res.json({ quotation: updated, discountApproved: true });
      return;
    }

    // Standard quotation approval
    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        managerApprovalStatus: 'APPROVED',
        managerApprovedById: req.adminSession!.user.id,
        managerApprovedAt: new Date(),
        managerSignatureUrl,
      },
    });

    // Regenerate PDF so it includes the manager's signature
    await quotationPdfService.generatePdf(req.params.id);

    const assignedAgent = quotation.assignedTo ? await userRepository.findById(quotation.assignedTo) : null;
    if (assignedAgent?.email) {
      await dispatchNotification({
        type: 'lead_assignment',
        to: [assignedAgent.email],
        subject: `Quotation Approved — Ready to Send${quotation.reference ? ` (${quotation.reference})` : ''}`,
        data: {
          quotationId: quotation.id,
          quotationNo: quotation.reference,
          customerName: quotation.customerName,
          vehicleModel: quotation.vehicleModel,
          nextStep: 'Review the approved quotation and send it to the customer.',
          adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
        },
        inApp: {
          type: 'quotation_approved',
          title: 'Quotation Approved',
          body: `Hello ${assignedAgent.name}, quotation ${quotation.reference || ''} for ${quotation.customerName} has been approved by the manager. You can now send it to the customer.`,
          link: `/admin/quotations/${quotation.id}`,
          quotationId: quotation.id,
          relatedModel: 'quotation',
          relatedId: quotation.id,
          priority: 'normal',
        },
      });
    }
    res.json({ quotation: updated });
  } catch (error) {
    console.error('Approve quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/submit (public - submit lead quotation)
router.post('/submit', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { configuration, visitId: _visitId, ...body } = req.body;
    const result = await quotationService.create({
      title: body.title,
      customerName: body.customerName,
      phoneNumber: body.phoneNumber,
      email: body.email,
      nationalId: body.nationalId,
      idDocumentType: body.idDocumentType,
      idPhotoUrl: body.idPhotoUrl,
      customerAddress: body.customerAddress,
      customerTin: body.customerTin,
      vehicleModel: body.vehicleModel,
      message: body.message,
      financingInterest: body.financingInterest,
      tradeInInterest: body.tradeInInterest,
      source: body.source,
      configurationJson: configuration,
      autoAssign: true,
    });
    if (!result.ok || !result.data) {
      res.status(400).json({ error: result.error || 'Failed to save quotation' });
      return;
    }

    // Step 1: Send confirmation email to the customer
    let confirmationEmailSent = false;
    if (body.email) {
      const emailResult = await sendQuotationConfirmationEmail({
        to: body.email,
        customerName: body.customerName,
        reference: result.data.reference,
        vehicleModel: body.vehicleModel,
      });
      confirmationEmailSent = emailResult.ok;
    }

    res.status(201).json({
      success: true,
      reference: result.data.reference,
      salesAgentNotified: Boolean(result.assignedRep),
      confirmationEmailSent,
    });
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

    // Send email notification to the assigned rep and manager. The
    // auto-assign path's result.data is a {userId,...} scoring summary, but
    // a manual assignment's result.data is the raw updated Quotation row
    // (assignedTo, not userId) — resolve whichever shape actually came back
    // so a manual assign doesn't silently skip the notification.
    const assignedRepId = result.data?.userId || result.data?.assignedTo;
    const assignedRep = assignedRepId ? await userRepository.findById(assignedRepId) : null;
    if (assignedRep?.email) {
      const managerEmails = await getManagerEmails();
      await dispatchNotification({
        type: 'lead_assignment',
        to: [assignedRep.email, ...managerEmails],
        subject: `New Quotation Assignment${quotation.reference ? ` (${quotation.reference})` : ''}`,
        data: {
          quotationId: quotation.id,
          quotationNo: quotation.reference,
          customerName: quotation.customerName,
          phoneNumber: quotation.phoneNumber,
          vehicleModel: quotation.vehicleModel,
          assignedTo: assignedRep.name,
          adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
        },
        inApp: {
          type: 'lead_assignment',
          title: 'New Quotation Assigned',
          body: `Hello ${assignedRep.name}, you have been assigned a new quotation${quotation.reference ? ` (${quotation.reference})` : ''} for ${quotation.customerName}${quotation.vehicleModel ? ` — ${quotation.vehicleModel}` : ''}. Please review and follow up.`,
          link: `/admin/quotations/${quotation.id}`,
          quotationId: quotation.id,
          relatedModel: 'quotation',
          relatedId: quotation.id,
          priority: 'high',
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
