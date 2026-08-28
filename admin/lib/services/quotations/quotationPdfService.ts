import { quotationRepository } from '@/repositories/quotationRepository';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { buildSalesQuotationPdf, computeQuotationTotals } from '@/lib/services/sales/salesQuotationPdf';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

export type GenerateQuotationPdfResult =
  | { ok: true; quotation: any; notificationSent: boolean }
  | { ok: false; httpStatus: 400 | 404 | 500; error: string };

/**
 * Saves pricing/vehicle details, generates the quotation number on first
 * use (kept stable across later re-sends), and emails the PDF to the
 * customer. Unlike the sales invoice, this is NOT a one-way lock — a
 * quotation can be revised and resent before the deal is finalized.
 */
export async function generateAndSendQuotationPdf(id: string, body: any): Promise<GenerateQuotationPdfResult> {
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

  let updated;
  try {
    updated = await quotationRepository.update(id, {
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
    });
  } catch (dbError) {
    console.error('[quotations:quotation-pdf:generate]', dbError);
    return { ok: false, httpStatus: 500, error: 'Failed to generate quotation. Please try again.' };
  }

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
      console.error('[quotations:quotation-pdf:email]', emailError);
    }
  }

  return { ok: true, quotation: updated, notificationSent };
}
