import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { sendQuotationConfirmationEmail } from '../services/email/statusEmail';
import { assignSalesRep } from '../services/sales/assignSalesRep';
import { quotationService } from '../services/sales/quotation.service';
import { convertQuotationToOrderService } from '../services/sales/convertQuotationToOrder.service';
import { quotationPdfService } from '../services/sales/quotationPdf.service';
import { generateReference, REFERENCE_CATEGORY } from '../utils/reference';
import { validateTin, validateIdDocumentNumber } from '../utils/idValidation';
import { userRepository, quotationRepository } from '../repositories';
import { env } from '../config/env';
import { auditService } from '../services/audit/audit.service';
import fs from 'fs';
import path from 'path';
import { UPLOAD_ROOT } from './upload.routes';
import { sendPdf } from '../utils/sendPdf';

const router = Router();

// Every admin-session-gated route below never checked a permission — any
// authenticated staff member of any role could read, edit, approve, or
// escalate any quotation. Split to match apps/admin/app/admin/quotations
// page.tsx/[id]/page.tsx (requirePermission('canViewQuotations') to load the
// list/detail pages) vs the `canManage` prop those pages derive from
// session.user.permissions.canManageQuotations (gating every mutating action
// button on the detail page — send, approve, reject, escalate, convert,
// regenerate PDF, assign rep) and new/page.tsx (requirePermission
// ('canManageQuotations')). POST /submit stays public — it's the
// customer-facing lead-capture form, not an admin route.
const viewGate = requirePermission('canViewQuotations');
const manageGate = requirePermission('canManageQuotations');

// Persists a rendered quotation PDF snapshot so `Quotation.pdfUrl` reflects
// the exact document a manager approved or a customer signed, even if the
// order's underlying fields change afterward (see the field's doc comment
// on the Quotation model). Reuses the same uploads directory/URL convention
// as backend/src/routes/upload.routes.ts.
export function persistQuotationPdfSnapshot(quotationId: string, buffer: Buffer): string {
  const folder = path.join(UPLOAD_ROOT, 'quotations');
  fs.mkdirSync(folder, { recursive: true });
  const filename = `${quotationId}-${Date.now()}.pdf`;
  fs.writeFileSync(path.join(folder, filename), buffer);
  return `/uploads/quotations/${filename}`;
}

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
router.get('/', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
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
router.post('/', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    // UC-01 dedupe: an already-open inquiry for this phone number is reused
    // instead of creating a duplicate lead (WalkInLeadForm surfaces this via
    // `deduped` and redirects to the existing quotation either way).
    if (req.body.phoneNumber) {
      const existingOpen = await quotationRepository.findOpenByPhone(req.body.phoneNumber);
      if (existingOpen) {
        res.json({ deduped: true, quotation: existingOpen });
        return;
      }
    }
    const quotation = await prisma.quotation.create({ data: req.body });
    res.status(201).json({ quotation });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id (admin detail)
router.get('/:id', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { tradeInEvaluation: true },
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
router.get('/:id/prior-inquiries', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
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
// Edit lock: once the customer has signed, the document is fully executed —
// no silent edits, any correction needs a new version through the normal
// quotation-pdf regenerate path (which itself is blocked below once signed).
// While a generated quotation is awaiting manager approval, the agent is
// blocked from unrestricted edits too (per the workflow spec) — but a
// quotation that hasn't been priced/generated yet (quotationGeneratedAt
// null) is exempt, since managerApprovalStatus defaults to PENDING from
// creation and the agent must be able to freely edit before ever submitting.
router.put('/:id', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Quotation not found' }); return; }
    if (existing.signedAt) {
      res.status(423).json({ error: 'This quotation has been signed by the customer and is locked. Regenerate a new version to make a correction.' });
      return;
    }
    if (existing.quotationGeneratedAt && existing.managerApprovalStatus === 'PENDING') {
      res.status(423).json({ error: 'This quotation is pending manager approval and cannot be edited until the manager acts on it.' });
      return;
    }
    const quotation = await prisma.quotation.update({ where: { id: req.params.id }, data: req.body });
    res.json(quotation);
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quotations/:id (admin delete)
router.delete('/:id', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
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
router.post('/:id/send-quotation', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
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

    await auditService.log({
      entityType: 'quotation',
      entityId: quotation.id,
      action: 'sent',
      performedById: req.adminSession!.user.id,
      fromValue: { status: quotation.status },
      toValue: { status: 'sent' },
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

      const statusLink = quotation.reference ? `${env.urls.site}/status?ref=${encodeURIComponent(quotation.reference)}` : undefined;
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
        ctas: [
          ...(link ? [{ label: 'Review & Sign Quotation', url: link }] : []),
          ...(statusLink ? [{ label: 'Check Status', url: statusLink }] : []),
        ],
      });
      notificationSent = result.ok;
      notificationError = result.error;

      // Notify the assigned sales agent that quotation was sent to customer
      if (quotation.assignedTo) {
        try {
          const agent = await prisma.user.findUnique({ where: { id: quotation.assignedTo } });
          if (agent?.email) {
            await dispatchNotification({
              type: 'quotation',
              to: [agent.email],
              subject: `Quotation Sent to Customer — ${quotation.reference || quotation.id}`,
              data: {
                quotationId: quotation.id,
                quotationNo: quotation.reference,
                customerName: quotation.customerName,
                vehicleModel: quotation.vehicleModel,
              },
              inApp: {
                type: 'quotation',
                title: 'Quotation Sent to Customer',
                body: `Quotation ${quotation.reference || quotation.id} for ${quotation.customerName} (${quotation.vehicleModel}) was sent to the customer.`,
                link: `/admin/quotations/${quotation.id}`,
                quotationId: quotation.id,
                relatedModel: 'quotation',
                relatedId: quotation.id,
                priority: 'normal',
              },
            });
          }
        } catch (agentNotifyError: any) {
          console.error('[AGENT NOTIFICATION ERROR]', agentNotifyError.message);
        }
      }
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
router.post('/:id/reject-quotation', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
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

    await auditService.log({
      entityType: 'quotation',
      entityId: quotation.id,
      action: 'rejected',
      performedById: req.adminSession!.user.id,
      toValue: { managerApprovalStatus: 'REJECTED' },
      reason,
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
router.get('/:id/quotation-pdf', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    // Check if a stored PDF exists
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id }, select: { pdfUrl: true } });
    if (quotation?.pdfUrl) {
      const result = await quotationPdfService.generatePdf(req.params.id);
      if (result.ok && result.data) {
        sendPdf(req, res, result.data, { filename: `quotation-${req.params.id}.pdf`, title: `Sales Quotation` });
        return;
      }
    }

    const result = await quotationPdfService.generatePdf(req.params.id);
    if (!result.ok || !result.data) {
      res.status(404).json({ error: result.error || 'Quotation not found or not generated yet.' });
      return;
    }
    sendPdf(req, res, result.data, { filename: `quotation-${req.params.id}.pdf`, title: `Sales Quotation` });
  } catch (error) {
    console.error('Get quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/quotation-pdf (generate/regenerate the Sales
// Quotation — see QuotationPdfPanel.tsx for the real request body shape and
// the manager-approval reset-on-regenerate behavior).
router.post('/:id/quotation-pdf', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    if (quotation.signedAt) {
      res.status(423).json({ error: 'This quotation has already been signed by the customer and is locked.' });
      return;
    }

    const {
      unitPrice, quantity, discountAmount, vehicleYear, vehicleColor, quotationValidUntil, paymentTerms, deliveryTerms,
      // New Sales Quotation format fields (Kerchanshe Trading PLC draft) — see QuotationPdfPanel.tsx.
      salesType, salesExecutiveName, customerTin, customerAddress, vehicleVariant, vehicleVin,
      registrationCharge, registrationResponsibility, insuranceResponsibility, chargingEquipmentDetails,
      depositAmount, depositDueDate, balanceDueDate, deliveryLocation, expectedHandoverNote,
    } = req.body;
    const tinError = validateTin(customerTin);
    if (tinError) {
      res.status(400).json({ error: tinError });
      return;
    }
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
        totalPrice: Math.max(0, parsedUnitPrice * parsedQuantity - parsedDiscount) + vatAmount,
        salesAgent: assignedAgent?.name || 'Unassigned',
        nextStep: 'Review the pricing and approve or reject the quotation.',
        adminLink: `${env.urls.admin}/admin/quotations/${quotation.id}`,
      },
      ctas: [{ label: 'Review & Approve', url: `${env.urls.admin}/admin/quotations/${quotation.id}` }],
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

    // Generate PDF and persist a real snapshot (not just a viewer URL) so
    // Quotation.pdfUrl actually holds the exact document a manager/customer
    // saw, per the field's doc comment.
    const pdfResult = await quotationPdfService.generatePdf(updated.id);
    let storedPdfUrl: string | null = null;
    if (pdfResult.ok && pdfResult.data) {
      storedPdfUrl = persistQuotationPdfSnapshot(updated.id, pdfResult.data);
      await prisma.quotation.update({ where: { id: updated.id }, data: { pdfUrl: storedPdfUrl } });
    }

    res.json({ quotation: { ...updated, pdfUrl: storedPdfUrl }, pdfUrl: pdfResult.ok ? `/api/quotations/${updated.id}/quotation-pdf` : null });
  } catch (error) {
    console.error('Generate quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/escalate (escalate to manager)
router.post('/:id/escalate', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Quotation not found' }); return; }

    // "Escalate to Manager" must actually hand the quotation to a manager —
    // it previously only flagged status/escalatedAt while leaving
    // `assignedTo` untouched, so the original (possibly busy) rep stayed
    // assigned and got a misleading "reassigned to you" email about their
    // own quotation. Pick whichever active manager currently has the
    // lightest load, same workload-aware logic as the sales-rep auto-assign.
    const managerAssignment = await assignSalesRep({
      targetType: 'quotation',
      targetId: req.params.id,
      autoAssign: true,
      forceManagerOnly: true,
    });
    if (!managerAssignment.ok) {
      res.status(400).json({ error: managerAssignment.error || 'No manager is available to escalate to.' });
      return;
    }

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

    await auditService.log({
      entityType: 'quotation',
      entityId: quotation.id,
      action: 'escalated',
      performedById: req.adminSession!.user.id,
      fromValue: { assignedTo: existing.assignedTo },
      toValue: { assignedTo: quotation.assignedTo },
      reason: req.body.reason,
    });

    // Send email notification to the new assignee and manager
    let notificationSent = false;
    let notificationError: string | undefined;
    if (quotation.assignedTo) {
      const assignedUser = await userRepository.findById(quotation.assignedTo);
      if (assignedUser?.email) {
        const managerEmails = await getManagerEmails();
        const notifyResult = await dispatchNotification({
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
        notificationSent = notifyResult.ok;
        notificationError = notifyResult.error;
      } else {
        notificationError = 'The assigned manager has no email address on file.';
      }
    }

    res.json({ ...quotation, notificationSent, notificationError });
  } catch (error) {
    console.error('Escalate quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/check-overdue-escalations (check and auto-escalate overdue)
router.post('/check-overdue-escalations', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const result = await quotationService.checkOverdueEscalations();
    res.json(result);
  } catch (error) {
    console.error('Check overdue escalations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/convert-to-order (convert to sales order)
router.post('/:id/convert-to-order', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const result = await convertQuotationToOrderService.convert(req.params.id, req.body?.assignedTo, req.adminSession!.user.id);
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
router.post('/:id/approve-quotation', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
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

      await auditService.log({
        entityType: 'quotation',
        entityId: quotation.id,
        action: 'discount_approved',
        performedById: req.adminSession!.user.id,
        toValue: { managerApprovalStatus: 'APPROVED', discountPercent },
      });

      // Regenerate PDF so it includes the manager's signature, and persist a
      // snapshot of the manager-approved document.
      const discountPdfResult = await quotationPdfService.generatePdf(req.params.id);
      if (discountPdfResult.ok && discountPdfResult.data) {
        const snapshotUrl = persistQuotationPdfSnapshot(req.params.id, discountPdfResult.data);
        await prisma.quotation.update({ where: { id: req.params.id }, data: { pdfUrl: snapshotUrl } });
      }

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
          ctas: [{ label: 'View Approved Quotation', url: `${env.urls.admin}/admin/quotations/${quotation.id}` }],
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

    await auditService.log({
      entityType: 'quotation',
      entityId: quotation.id,
      action: 'approved',
      performedById: req.adminSession!.user.id,
      toValue: { managerApprovalStatus: 'APPROVED' },
    });

    // Regenerate PDF so it includes the manager's signature, and persist a
    // snapshot of the manager-approved document.
    const approvalPdfResult = await quotationPdfService.generatePdf(req.params.id);
    if (approvalPdfResult.ok && approvalPdfResult.data) {
      const snapshotUrl = persistQuotationPdfSnapshot(req.params.id, approvalPdfResult.data);
      await prisma.quotation.update({ where: { id: req.params.id }, data: { pdfUrl: snapshotUrl } });
    }

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
        ctas: [{ label: 'View Approved Quotation', url: `${env.urls.admin}/admin/quotations/${quotation.id}` }],
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
    if (body.nationalId) {
      const idError = validateIdDocumentNumber(body.nationalId, body.idDocumentType);
      if (idError) { res.status(400).json({ error: idError }); return; }
    }
    const tinError = validateTin(body.customerTin);
    if (tinError) { res.status(400).json({ error: tinError }); return; }
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
      quantity: body.quantity,
      referralSource: body.referralSource,
      campaign: body.campaign,
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
router.post('/:id/assign-rep', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
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
    let notificationSent = false;
    let notificationError: string | undefined;
    if (assignedRep?.email) {
      const managerEmails = await getManagerEmails();
      const notifyResult = await dispatchNotification({
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
      notificationSent = notifyResult.ok;
      notificationError = notifyResult.error;
    }

    res.json({ success: true, assignedRep: result.data, error: result.error, notificationSent, notificationError });
  } catch (error) {
    console.error('Assign rep error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as quotationRoutes };
