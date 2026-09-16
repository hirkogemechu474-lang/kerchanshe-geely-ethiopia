import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawFieldTable,
  ensureSpace, wrapText, PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, dateValue, fillValue,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface WarrantyCertificatePdfData {
  orderNo: string;
  customerName: string;
  customerPhone?: string | null;
  vehicleModel: string;
  vin?: string | null;
  purchaseDate: Date | string;
  warrantyStartDate: Date | string;
  warrantyEndDate: Date | string;
  warrantyYears: number;
  warrantyKm: number;
  nextServiceDate?: Date | string | null;
  nextServiceKm?: number | null;
}

const TERMS = [
  'This warranty covers manufacturing defects in materials and workmanship under normal use, subject to the manufacturer’s warranty policy.',
  'Coverage ends at whichever comes first: the warranty end date above, or the vehicle reaching the maximum warranty distance.',
  'Regular scheduled maintenance at an authorized service center is required to keep this warranty valid.',
  'Damage from accidents, misuse, unauthorized modification, or normal wear items is not covered.',
  'Present this certificate (or the order/reference number above) when booking service or filing a warranty claim.',
];

// Simpler than salesInvoice.pdf.ts/handover.pdf.ts by design — a one-page
// certificate with no signature block, mirroring the invoice PDF's own
// "deliberately minimal" scope note.
export async function generateWarrantyCertificatePdf(data: WarrantyCertificatePdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  let ctx = addPage(doc);
  drawHeaderFooter(ctx, 'VEHICLE WARRANTY CERTIFICATE', company);

  ctx.y = PDF_HEADER_CONTENT_Y;

  drawSectionTitle(ctx, 'Customer & Vehicle');
  ctx = drawFieldTable(ctx, [
    ['Order No.', fillValue(data.orderNo)],
    ['Customer Name', fillValue(data.customerName)],
    ['Phone', fillValue(data.customerPhone)],
    ['Vehicle Model', fillValue(data.vehicleModel)],
    ['VIN / Chassis No.', fillValue(data.vin)],
    ['Purchase Date', dateValue(data.purchaseDate)],
  ]);

  ctx.y -= 12;
  drawSectionTitle(ctx, 'Warranty Coverage');
  ctx = drawFieldTable(ctx, [
    ['Warranty Start', dateValue(data.warrantyStartDate)],
    ['Warranty End', dateValue(data.warrantyEndDate)],
    ['Coverage Period', `${data.warrantyYears} years`],
    ['Coverage Distance', `${data.warrantyKm.toLocaleString()} km`],
    ['Next Scheduled Service', data.nextServiceDate ? dateValue(data.nextServiceDate) : '—'],
    ['Next Service Due At', data.nextServiceKm != null ? `${data.nextServiceKm.toLocaleString()} km` : '—'],
  ]);

  ctx.y -= 16;
  drawSectionTitle(ctx, 'Terms');
  TERMS.forEach((term, i) => {
    ctx = ensureSpace(ctx, 32);
    ctx = wrapText(ctx, `${i + 1}. ${term}`, PDF_MARGIN, ctx.y, 8.5, PDF_CONTENT_WIDTH);
    ctx.y -= 10;
  });

  return saveBuffer(doc);
}
