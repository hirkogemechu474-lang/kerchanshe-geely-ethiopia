import { quotationRepository } from '@/repositories/quotationRepository';
import { userRepository } from '@/repositories/userRepository';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { buildSalesQuotationPdf, computeQuotationTotals } from '@/lib/services/sales/salesQuotationPdf';
import { sendStatusEmail } from '@/lib/status-email';
import { notifyStaffOfQuotationSent, notifyApproversOfPendingQuotation } from '@/lib/services/quotations/leadNotifications';
import { env } from '@/lib/env';

export type GenerateQuotationPdfResult =
  | { ok: true; quotation: any }
  | { ok: false; httpStatus: 400 | 404 | 500; error: string };

/**
 * Saves pricing/vehicle details and generates the quotation number on first
 * use (kept stable across later re-sends). Does NOT email the customer —
 * see sendQuotationToCustomer, which is gated on manager approval below. A
 * quotation can be revised and regenerated before the deal is finalized; a
 * previously-rejected quotation returns to PENDING for a fresh review.
 */
export async function generateQuotationPdf(id: string, body: any): Promise<GenerateQuotationPdfResult> {
  const existing = await quotationRepository.findById(id);
  if (!existing) {
    return { ok: false, httpStatus: 404, error: 'Quotation not found' };
  }

  const unitPrice = Number(body.unitPrice);
  const quantity = Math.max(1, Number(body.quantity) || 1);
  const discountAmount = Number(body.discountAmount) || 0;
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return { ok: false, httpStatus: 400, error: 'Unit price must be a valid positive number' };
  }
  if (!Number.isFinite(discountAmount) || discountAmount < 0) {
    return { ok: false, httpStatus: 400, error: 'Discount must be a valid non-negative number' };
  }

  const { vatAmount } = computeQuotationTotals(unitPrice, quantity, discountAmount);
  const quotationNo = existing.quotationNo || (await generateReference(REFERENCE_CATEGORY.QUOTATION));

  try {
    const updated = await quotationRepository.update(id, {
      quotationNo,
      unitPrice,
      quantity,
      discountAmount,
      vatAmount,
      vehicleYear: body.vehicleYear ?? existing.vehicleYear,
      vehicleColor: body.vehicleColor ?? existing.vehicleColor,
      quotationValidUntil: body.quotationValidUntil ? new Date(body.quotationValidUntil) : existing.quotationValidUntil,
      paymentTerms: body.paymentTerms ?? existing.paymentTerms,
      deliveryTerms: body.deliveryTerms ?? existing.deliveryTerms,
      quotationGeneratedAt: new Date(),
      // A correction after rejection goes back to the manager for a fresh look.
      ...(existing.managerApprovalStatus === 'REJECTED' && {
        managerApprovalStatus: 'PENDING' as const,
        managerRejectedById: null,
        managerRejectedAt: null,
        managerRejectionReason: null,
      }),
    });

    if (updated.managerApprovalStatus === 'PENDING') {
      await notifyApproversOfPendingQuotation(updated);
    }

    return { ok: true, quotation: updated };
  } catch (dbError) {
    console.error('[quotations:quotation-pdf:generate]', dbError);
    return { ok: false, httpStatus: 500, error: 'Failed to generate quotation. Please try again.' };
  }
}

export type ApproveQuotationResult =
  | { ok: true; quotation: any }
  | { ok: false; httpStatus: 404 | 409; error: string };

/** Manager sign-off gate — must run before sendQuotationToCustomer will allow a send. */
export async function approveQuotation(id: string, managerId: string): Promise<ApproveQuotationResult> {
  const quotation = await quotationRepository.findById(id);
  if (!quotation) {
    return { ok: false, httpStatus: 404, error: 'Quotation not found' };
  }
  if (!quotation.quotationNo) {
    return { ok: false, httpStatus: 409, error: 'Generate the quotation before approving it.' };
  }
  if (quotation.managerApprovalStatus !== 'PENDING') {
    return { ok: false, httpStatus: 409, error: 'This quotation has already been reviewed.' };
  }

  const updated = await quotationRepository.update(id, {
    managerApprovalStatus: 'APPROVED',
    managerApprovedById: managerId,
    managerApprovedAt: new Date(),
  });
  return { ok: true, quotation: updated };
}

export type RejectQuotationResult =
  | { ok: true; quotation: any }
  | { ok: false; httpStatus: 404 | 409; error: string };

/** "Return for correction" — notifies the assigned rep (best-effort) so they can fix and resend. */
export async function rejectQuotation(id: string, managerId: string, reason: string): Promise<RejectQuotationResult> {
  const quotation = await quotationRepository.findById(id);
  if (!quotation) {
    return { ok: false, httpStatus: 404, error: 'Quotation not found' };
  }
  if (!quotation.quotationNo) {
    return { ok: false, httpStatus: 409, error: 'Generate the quotation before rejecting it.' };
  }
  if (quotation.managerApprovalStatus !== 'PENDING') {
    return { ok: false, httpStatus: 409, error: 'This quotation has already been reviewed.' };
  }

  const updated = await quotationRepository.update(id, {
    managerApprovalStatus: 'REJECTED',
    managerRejectedById: managerId,
    managerRejectedAt: new Date(),
    managerRejectionReason: reason,
  });

  if (updated.assignedTo) {
    try {
      const rep = await userRepository.findActiveSalesRepByName(updated.assignedTo);
      if (rep?.email) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
        await sendStatusEmail({
          to: rep.email,
          name: rep.name,
          entityType: 'sales quotation',
          status: 'returned for correction',
          reference: updated.reference || updated.quotationNo || updated.id,
          details: `Reason: ${reason}`,
          actionUrl: adminUrl ? `${adminUrl.replace(/\/$/, '')}/admin/quotations/${updated.id}` : undefined,
          actionLabel: 'Correct Quotation',
        });
      }
    } catch (error) {
      console.error('[quotations:reject:notify]', error);
    }
  }

  return { ok: true, quotation: updated };
}

export type SendQuotationResult =
  | { ok: true; quotation: any; notificationSent: boolean }
  | { ok: false; httpStatus: 404 | 409; error: string };

/**
 * Emails the approved quotation PDF to the customer, notifies every active
 * sales-role user, and — only if nobody is assigned yet — attributes the
 * sender as the commission owner (never overrides an existing assignment).
 */
export async function sendQuotationToCustomer(id: string, senderName: string | null): Promise<SendQuotationResult> {
  const existing = await quotationRepository.findById(id);
  if (!existing) {
    return { ok: false, httpStatus: 404, error: 'Quotation not found' };
  }
  if (!existing.quotationNo) {
    return { ok: false, httpStatus: 409, error: 'Generate the quotation before sending it.' };
  }
  if (existing.managerApprovalStatus !== 'APPROVED') {
    return { ok: false, httpStatus: 409, error: 'This quotation needs manager approval before it can be sent.' };
  }

  const updated = !existing.assignedTo && senderName
    ? await quotationRepository.update(id, { assignedTo: senderName })
    : existing;

  let notificationSent = false;
  if (updated.email) {
    try {
      const pdfBytes = await buildSalesQuotationPdf(updated);
      const siteUrl = env.app.url.replace(/\/$/, '');
      const alreadySigned = Boolean(updated.signedDocumentUrl);
      const signingUrl = !alreadySigned && updated.reference ? `${siteUrl}/quotation/${encodeURIComponent(updated.reference)}` : undefined;
      notificationSent = await sendStatusEmail({
        to: updated.email,
        name: updated.customerName,
        entityType: 'sales quotation',
        status: 'sent',
        reference: updated.reference || updated.quotationNo || updated.id,
        details: alreadySigned
          ? `Your revised sales quotation ${updated.quotationNo} is attached.`
          : `Your sales quotation ${updated.quotationNo} is attached. Please review, sign, and return it to proceed.`,
        actionUrl: signingUrl,
        actionLabel: 'Review & Sign Quotation',
        attachments: [{ filename: `${updated.quotationNo}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }],
      });
    } catch (emailError) {
      console.error('[quotations:send:email]', emailError);
    }
  }

  await notifyStaffOfQuotationSent(updated, senderName);

  return { ok: true, quotation: updated, notificationSent };
}
