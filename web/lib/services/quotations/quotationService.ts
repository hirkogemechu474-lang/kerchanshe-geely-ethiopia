import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { quotationRepository } from '@/repositories/quotationRepository';
import { showroomVisitRepository } from '@/repositories/showroomVisitRepository';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { nextSalesRep } from '@/lib/assignSalesRep';
import { UPLOADS_ROOT } from '@/lib/upload-utils';
import { buildSalesQuotationPdf, stampSignatureOnQuotationPdf } from '@/lib/services/sales/salesQuotationPdf';
import { notifyManagersOfNewLead, notifyAssignedRep } from '@/lib/services/quotations/leadNotifications';

export interface LeadQuotationInput {
  customerName: string;
  phoneNumber: string;
  email: string;
  vehicleModel: string;
  preferredDealer?: string;
  financingInterest?: boolean;
  tradeInInterest?: boolean;
  message?: string;
  configuration?: any;
  source: string;
  visitId?: string | null;
}

// Submitted via web/app/api/quotations/route.ts — the general lead-capture
// form (configurator "Send Configuration" handoff, quote page, etc).
export async function submitLeadQuotation(input: LeadQuotationInput) {
  const reference = await generateReference(REFERENCE_CATEGORY.QUOTATION);
  const assignedRep = await nextSalesRep(input.preferredDealer);
  const quotation = await quotationRepository.create({
    customerName: input.customerName,
    phoneNumber: input.phoneNumber,
    email: input.email,
    vehicleModel: input.vehicleModel,
    preferredDealer: input.preferredDealer || null,
    financingInterest: input.financingInterest ?? false,
    tradeInInterest: input.tradeInInterest ?? false,
    message: input.message || null,
    configurationJson: input.configuration ?? undefined,
    source: input.source,
    status: 'new',
    reference,
    assignedTo: assignedRep?.name ?? null,
  });

  if (input.visitId) {
    await showroomVisitRepository.linkQuotation(input.visitId, quotation.id).catch((error) => {
      console.error('[quotations:visit-link]', error);
    });
  }

  await Promise.all([
    notifyManagersOfNewLead(quotation, assignedRep?.name ?? null),
    notifyAssignedRep(quotation, assignedRep?.id ?? null),
  ]);

  let notificationSent = false;
  try {
    const configuration = input.configuration;
    notificationSent = await sendFormEmail({
      type: 'quotation request',
      name: input.customerName,
      email: input.email,
      phone: input.phoneNumber,
      reference,
      subject: `New quotation request — ${input.vehicleModel}`,
      details: [
        `Vehicle: ${input.vehicleModel}`,
        configuration?.trim ? `Trim: ${configuration.trim}` : '',
        configuration?.color ? `Color: ${configuration.color}` : '',
        configuration?.wheels ? `Wheels: ${configuration.wheels}` : '',
        configuration?.interior ? `Interior: ${configuration.interior}` : '',
        Array.isArray(configuration?.accessories) && configuration.accessories.length > 0
          ? `Accessories: ${configuration.accessories.join(', ')}`
          : '',
        `Financing requested: ${input.financingInterest ? 'Yes' : 'No'}`,
        `Trade-in requested: ${input.tradeInInterest ? 'Yes' : 'No'}`,
        input.preferredDealer ? `Preferred dealer: ${input.preferredDealer}` : '',
        assignedRep ? `Assigned Sales Consultant: ${assignedRep.name}` : '',
        input.message ? `Message:\n${input.message}` : '',
      ].filter(Boolean).join('\n'),
    });
  } catch (error) {
    console.error('[quotations:email] Failed to send notification:', error);
  }

  return { quotation, reference, notificationSent };
}

export interface QuoteFormInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleId: string;
  vehicleName?: string;
  purchaseTimeframe?: string;
  financingNeeded?: string;
  tradeIn?: string;
  tradeInDetails?: string;
  message?: string;
}

export type QuoteFormResult =
  | { ok: true; quotation: any; reference: string }
  | { ok: false; httpStatus: 404; error: string };

// Submitted via web/app/api/public/quotations/route.ts — the /quote page form.
export async function submitQuoteFormQuotation(input: QuoteFormInput): Promise<QuoteFormResult> {
  const reference = await generateReference(REFERENCE_CATEGORY.QUOTATION);
  const assignedRep = await nextSalesRep();

  const customerName = `${input.firstName} ${input.lastName}`;

  const notes = `
Purchase Timeframe: ${input.purchaseTimeframe || 'Not specified'}
Financing Needed: ${input.financingNeeded || 'Not specified'}
Trade-In: ${input.tradeIn || 'No'}
${input.tradeInDetails ? `Trade-In Details: ${input.tradeInDetails}` : ''}
${input.message ? `Additional Message: ${input.message}` : ''}
    `.trim();

  const vehicle = await vehicleRepository.findForQuote(input.vehicleId);

  if (!vehicle) {
    return { ok: false, httpStatus: 404, error: 'Vehicle not found' };
  }

  const quotation = await quotationRepository.create({
    customerName,
    email: input.email,
    phoneNumber: input.phone,
    vehicleModel: input.vehicleName || vehicle.name,
    message: notes,
    financingInterest: Boolean(input.financingNeeded),
    tradeInInterest: Boolean(input.tradeIn),
    status: 'new',
    reference,
    assignedTo: assignedRep?.name ?? null,
  });

  await Promise.all([
    notifyManagersOfNewLead(quotation, assignedRep?.name ?? null),
    notifyAssignedRep(quotation, assignedRep?.id ?? null),
  ]);

  return { ok: true, quotation, reference };
}

export type SignQuotationResult =
  | { ok: true; signedDocumentUrl: string; signedAt: Date; status: string }
  | { ok: false; httpStatus: 400 | 404 | 409; error: string };

// Public — customer e-signs (or attaches a photo of a signed printout of)
// the Sales Quotation PDF. One-way: an already-signed quotation 409s rather
// than overwriting. On success, status automatically moves to "accepted".
export async function signQuotation(
  reference: string,
  type: 'drawn' | 'photo',
  payload: { signatureDataUrl?: string; photoUrl?: string }
): Promise<SignQuotationResult> {
  const quotation = await quotationRepository.findByReference(reference);
  if (!quotation) {
    return { ok: false, httpStatus: 404, error: 'Quotation not found' };
  }
  if (!quotation.quotationNo) {
    return { ok: false, httpStatus: 409, error: 'This quotation has not been generated yet.' };
  }
  if (quotation.signedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'This quotation has already been signed.' };
  }

  let signedDocumentUrl: string;

  if (type === 'drawn') {
    const signatureDataUrl = payload.signatureDataUrl || '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return { ok: false, httpStatus: 400, error: 'A valid drawn signature is required.' };
    }
    const basePdf = await buildSalesQuotationPdf(quotation);
    const signedPdf = await stampSignatureOnQuotationPdf(basePdf, signatureDataUrl);

    const uploadDir = path.join(UPLOADS_ROOT, 'signed-quotations');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${quotation.quotationNo}-${Date.now()}.pdf`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(signedPdf));
    signedDocumentUrl = `/uploads/signed-quotations/${filename}`;
  } else {
    const photoUrl = payload.photoUrl?.trim() || '';
    if (!photoUrl.startsWith('/uploads/')) {
      return { ok: false, httpStatus: 400, error: 'A valid uploaded photo is required.' };
    }
    signedDocumentUrl = photoUrl;
  }

  const updated = await quotationRepository.updateSignature(reference, {
    signedDocumentUrl,
    signedAt: new Date(),
    status: 'accepted',
  });

  return { ok: true, signedDocumentUrl: updated.signedDocumentUrl!, signedAt: updated.signedAt!, status: updated.status };
}
