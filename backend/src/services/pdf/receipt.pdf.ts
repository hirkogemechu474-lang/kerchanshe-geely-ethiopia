import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawLabelValue,
  drawFieldTable, ensureSpace, wrapText,
  PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, COLORS, dateValue, fillValue, formatBrandModel,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface ReceiptPdfData {
  orderNo: string;
  customerName: string;
  purchaserTitle?: string | null; // salutation, e.g. "Ato", "Miss", "Dr" — printed before customerName
  customerPhone?: string | null;
  customerEmail?: string | null;
  vehicleModel: string;
  vin?: string | null;
  totalPrice?: number | null;
  amountPaid?: number | null;
  paymentMethod?: string | null;
  paymentReferenceNo?: string | null;
  paymentVerifiedAt?: Date | string | null;
  verifiedByName?: string | null;
  verifiedByTitle?: string | null;
}

export async function generateReceiptPdf(data: ReceiptPdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  let ctx = addPage(doc);
  const title = 'PAYMENT RECEIPT';
  ctx = await drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;

  const customerDisplayName = data.purchaserTitle ? `${data.purchaserTitle} ${data.customerName || ''}`.trim() : (data.customerName || '—');
  const balanceDue = (data.totalPrice ?? 0) - (data.amountPaid ?? 0);

  drawLabelValue(ctx, 'Receipt No.', `RCPT-${data.orderNo}`, PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Receipt Date', dateValue(data.paymentVerifiedAt ?? new Date()), PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Sales Agreement No.', data.orderNo, PDF_MARGIN + 440, ctx.y);
  ctx.y -= 34;

  ctx = ensureSpace(ctx, 110);
  drawSectionTitle(ctx, 'Customer');
  ctx = drawFieldTable(ctx, [
    ['Name', customerDisplayName],
    ['Phone', data.customerPhone || '—'],
    ['Email', data.customerEmail || '—'],
  ]);
  ctx.y -= 6;

  ctx = ensureSpace(ctx, 90);
  drawSectionTitle(ctx, 'Vehicle');
  ctx = drawFieldTable(ctx, [
    ['Brand / Model', formatBrandModel(data.vehicleModel)],
    ['VIN / Chassis No.', data.vin || '—'],
  ]);
  ctx.y -= 6;

  ctx = ensureSpace(ctx, 150);
  drawSectionTitle(ctx, 'Payment Details');
  ctx = drawFieldTable(ctx, [
    ['Amount Paid', fillValue(data.amountPaid)],
    ['Payment Method', data.paymentMethod === 'cheque' ? 'Cheque' : data.paymentMethod === 'other' ? 'Other' : 'Bank Transfer'],
    ['Reference No.', data.paymentReferenceNo || '—'],
    ['Total Order Price', fillValue(data.totalPrice)],
    ['Balance Due', balanceDue > 0 ? fillValue(balanceDue) : 'Paid in Full'],
  ]);
  ctx.y -= 6;

  ctx = ensureSpace(ctx, 90);
  drawSectionTitle(ctx, 'Verification');
  ctx = drawFieldTable(ctx, [
    ['Verified By', [data.verifiedByName, data.verifiedByTitle].filter(Boolean).join(', ') || '—'],
    ['Verified At', dateValue(data.paymentVerifiedAt)],
  ]);
  ctx.y -= 16;

  ctx = ensureSpace(ctx, 40);
  ctx = wrapText(
    ctx,
    'This receipt confirms that the payment above has been reviewed and verified against the order record. Please keep this receipt for your records.',
    PDF_MARGIN, ctx.y, 9, PDF_CONTENT_WIDTH,
  );

  return saveBuffer(doc);
}
