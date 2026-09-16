import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawTable, drawFieldTable,
  ensureSpace, PDF_MARGIN, PDF_HEADER_CONTENT_Y, dateValue, fillValue, formatCurrency,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface ServiceInvoicePartLine {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ServiceInvoicePdfData {
  jobCardNo: string;
  invoiceNo: string;
  customerName: string;
  customerPhone?: string | null;
  vehicleModel?: string | null;
  vin?: string | null;
  plateNo?: string | null;
  complaintText?: string | null;
  parts: ServiceInvoicePartLine[];
  partsAmount: number;
  laborAmount: number;
  invoiceAmount: number;
  invoiceDate: Date | string;
}

// Simpler than salesInvoice.pdf.ts by design — a workshop job-card invoice
// (parts + labor) has no signature/agreement context, unlike a vehicle
// sale invoice.
export async function generateServiceInvoicePdf(data: ServiceInvoicePdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  let ctx = addPage(doc);
  drawHeaderFooter(ctx, 'SERVICE INVOICE', company);

  ctx.y = PDF_HEADER_CONTENT_Y;

  drawSectionTitle(ctx, 'Invoice');
  ctx = drawFieldTable(ctx, [
    ['Invoice No.', fillValue(data.invoiceNo)],
    ['Job Card No.', fillValue(data.jobCardNo)],
    ['Invoice Date', dateValue(data.invoiceDate)],
    ['Customer', fillValue(data.customerName)],
    ['Phone', fillValue(data.customerPhone)],
    ['Vehicle', fillValue(data.vehicleModel)],
    ['VIN / Plate', fillValue(data.vin || data.plateNo)],
    ['Reported Issue', fillValue(data.complaintText)],
  ]);

  ctx.y -= 12;
  ctx = ensureSpace(ctx, 40 + data.parts.length * 20);
  drawSectionTitle(ctx, 'Parts');
  if (data.parts.length > 0) {
    drawTable(
      ctx,
      ['Part', 'Qty', 'Unit Price', 'Total'],
      data.parts.map((p) => [p.name, p.quantity, formatCurrency(p.unitPrice), formatCurrency(p.unitPrice * p.quantity)]),
      [246, 60, 100, 100],
    );
    ctx.y -= 10;
  } else {
    ctx.page.drawText('No parts issued.', { x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.font });
    ctx.y -= 20;
  }

  ctx.y -= 12;
  ctx = ensureSpace(ctx, 100);
  drawSectionTitle(ctx, 'Totals');
  ctx = drawFieldTable(ctx, [
    ['Parts Total', formatCurrency(data.partsAmount)],
    ['Labor', formatCurrency(data.laborAmount)],
    ['Amount Due', formatCurrency(data.invoiceAmount)],
  ]);

  return saveBuffer(doc);
}
