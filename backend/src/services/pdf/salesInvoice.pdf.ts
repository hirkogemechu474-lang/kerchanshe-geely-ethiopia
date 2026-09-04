import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawTable, drawFieldTable,
  drawLabelValue, drawRightText, drawCheckbox, drawSignatureBlock, ensureSpace, wrapText,
  PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, COLORS, dateValue, fillValue, formatBrandModel,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';
import type { HandoverItemRow } from './handover.pdf';
import { amountToWordsETB } from '../../utils/numberToWords';

export interface InvoiceLineItem {
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

export interface SalesInvoicePdfData {
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  totalPrice: number;
  invoiceNo?: string | null;
  quotationNo?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerTin?: string | null;
  customerAddress?: string | null;
  color?: string | null;
  vehicleVariant?: string | null;
  vin?: string | null;
  motorBatterySerialNo?: string | null;
  odometerAtDelivery?: number | null;
  orderDate?: Date | string | null;
  salesType?: string | null;
  paymentStatus?: string | null;
  lineItems?: InvoiceLineItem[] | null;
  vatAmount?: number | null;
  registrationCharge?: number | null;
  amountPaid?: number | null;
  paymentMethod?: string | null;
  paymentReferenceNo?: string | null;
  deliveryDate?: Date | string | null;
  deliveryLocation?: string | null;
  itemsHandedOver?: HandoverItemRow[] | null;
  sellerSignerName?: string | null;
}

function taxableAmount(item: InvoiceLineItem): number {
  return item.qty * item.unitPrice - item.discount;
}

const IMPORTANT_NOTES = [
  'This invoice records the vehicle and items sold and the amount payable.',
  'VAT and other applicable taxes/charges should be applied according to the tax treatment in force at the time of invoicing.',
  'The vehicle is covered by the applicable GEELY/manufacturer warranty terms.',
  "Registration, insurance and government charges are the customer's responsibility unless included above.",
  'EV range and charging time vary with weather, speed, terrain, load, driving style and use of heating or air conditioning.',
  'Keep this invoice with the Sales Agreement and warranty documents.',
];

export async function generateSalesInvoicePdf(data: SalesInvoicePdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  let ctx = addPage(doc);
  const title = 'SALES INVOICE';
  drawHeaderFooter(ctx, title, company);

  ctx.y = PDF_HEADER_CONTENT_Y;
  drawLabelValue(ctx, 'Invoice No.', data.invoiceNo || data.orderNo, PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Invoice Date', dateValue(data.orderDate ?? new Date()), PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Sales Agreement No.', data.orderNo, PDF_MARGIN + 440, ctx.y);
  ctx.y -= 34;

  drawLabelValue(ctx, 'Quotation No.', data.quotationNo || '—', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Sales Type', data.salesType === 'order' ? 'Order' : 'Showroom / Stock', PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Payment Status', data.paymentStatus || '—', PDF_MARGIN + 440, ctx.y);
  ctx.y -= 30;

  ctx = ensureSpace(ctx, 130);
  drawSectionTitle(ctx, 'Seller & Customer');
  const half = (PDF_CONTENT_WIDTH - 16) / 2;
  const startY = ctx.y;

  function drawParty(x: number, heading: string, name: string, tin: string, address: string, contact: string): number {
    ctx.page.drawText(heading, { x, y: startY, size: 8, font: ctx.bold, color: COLORS.gray });
    ctx.page.drawText(name, { x, y: startY - 15, size: 10, font: ctx.bold, color: COLORS.dark });
    ctx.page.drawText(`TIN: ${tin}`, { x, y: startY - 29, size: 9, font: ctx.font, color: COLORS.dark });
    const afterAddress = wrapText(ctx, `Address: ${address}`, x, startY - 43, 9, half);
    ctx.page.drawText(contact, { x, y: afterAddress.y - 15, size: 9, font: ctx.font, color: COLORS.dark });
    return afterAddress.y - 15;
  }

  const sellerBottom = drawParty(PDF_MARGIN, 'SELLER', company.legalName, company.tin || '—', company.address, `Tel: ${company.phone || '—'}  Email: ${company.email || '—'}`);
  const custX = PDF_MARGIN + half + 16;
  const custBottom = drawParty(custX, 'CUSTOMER', data.customerName || '—', data.customerTin || '—', data.customerAddress || '—', `Tel: ${data.customerPhone || '—'}  Email: ${data.customerEmail || '—'}`);
  ctx.y = Math.min(sellerBottom, custBottom) - 14;

  ctx = ensureSpace(ctx, 150);
  drawSectionTitle(ctx, 'Vehicle Details');
  ctx = drawFieldTable(ctx, [
    ['Brand / Model', formatBrandModel(data.vehicleModel)],
    ['Variant / Battery', data.vehicleVariant || '—'],
    ['Colour', data.color || '—'],
    ['VIN / Chassis No.', data.vin || '—'],
    ['Motor / Battery Serial No.', data.motorBatterySerialNo || '—'],
    ['Odometer at Delivery', data.odometerAtDelivery != null ? `${data.odometerAtDelivery} km` : '—'],
    ['Quantity', '1 Unit'],
  ]);
  ctx.y -= 10;

  const lineItems: InvoiceLineItem[] = data.lineItems?.length
    ? data.lineItems
    : [{ description: `GEELY vehicle as specified above (${data.vehicleModel || '—'})`, qty: 1, unitPrice: data.totalPrice ?? 0, discount: 0 }];
  ctx = ensureSpace(ctx, 60 + lineItems.length * 20);
  drawSectionTitle(ctx, 'Invoice Details');
  drawTable(
    ctx,
    ['Description', 'Qty', 'Unit Price (ETB)', 'Discount (ETB)', 'Taxable Amount (ETB)'],
    lineItems.map((it) => [it.description, it.qty, fillValue(it.unitPrice), fillValue(it.discount), fillValue(taxableAmount(it))]),
    [PDF_CONTENT_WIDTH - 80 - 100 - 100 - 100, 80, 100, 100, 100],
  );
  ctx.y -= 10;

  const totalBeforeVat = lineItems.reduce((sum, it) => sum + taxableAmount(it), 0);
  const totalInvoice = totalBeforeVat + (data.vatAmount ?? 0) + (data.registrationCharge ?? 0);
  const balanceDue = totalInvoice - (data.amountPaid ?? 0);
  const summaryX = PDF_MARGIN + PDF_CONTENT_WIDTH - 240;
  const rightCol = PDF_MARGIN + PDF_CONTENT_WIDTH;
  const summaryRows: Array<[string, string, boolean?]> = [
    ['TOTAL BEFORE VAT', fillValue(totalBeforeVat)],
    ['VAT / Applicable Tax', fillValue(data.vatAmount)],
    ['Registration / Plate / Other Charge', fillValue(data.registrationCharge)],
    ['TOTAL INVOICE AMOUNT', fillValue(totalInvoice), true],
    ['Less: Amount Already Paid', `- ${fillValue(data.amountPaid)}`],
    ['BALANCE DUE', fillValue(balanceDue), true],
  ];
  ctx = ensureSpace(ctx, summaryRows.length * 16 + 10);
  for (const [label, value, bold] of summaryRows) {
    ctx.page.drawText(label, { x: summaryX, y: ctx.y, size: bold ? 10 : 9, font: bold ? ctx.bold : ctx.font, color: bold ? COLORS.dark : COLORS.gray });
    drawRightText(ctx, value, rightCol, ctx.y, bold ? 10 : 9, bold ? ctx.bold : ctx.font, COLORS.dark);
    ctx.y -= bold ? 18 : 15;
  }
  ctx.y -= 6;
  ctx = ensureSpace(ctx, 20);
  ctx = wrapText(ctx, `Amount in words: ${amountToWordsETB(totalInvoice)}`, PDF_MARGIN, ctx.y, 9, PDF_CONTENT_WIDTH);
  ctx.y -= 10;

  // ── Page 2: Payment, Delivery & Handover mini-section, notes, signatures ─
  ctx = addPage(doc);
  drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawSectionTitle(ctx, 'Payment');
  ctx = drawFieldTable(ctx, [
    ['Method', data.paymentMethod === 'cheque' ? 'Cheque' : data.paymentMethod === 'other' ? 'Other' : 'Bank Transfer'],
    ['Reference No. / Amount', `${data.paymentReferenceNo || '—'} / ${fillValue(data.amountPaid)}`],
    ['Bank / Account', company.bank.name || '—'],
    ['Account Name', company.bank.accountName || company.legalName],
    ['Account No.', company.bank.accountNumber || '—'],
  ]);
  ctx.y -= 6;

  ctx = ensureSpace(ctx, 140);
  drawSectionTitle(ctx, 'Delivery & Handover');
  ctx = drawFieldTable(ctx, [
    ['Delivery Date', dateValue(data.deliveryDate)],
    ['Location', data.deliveryLocation || '—'],
    ['Received By', data.customerName || '—'],
    ['Odometer', data.odometerAtDelivery != null ? `${data.odometerAtDelivery} km` : '—'],
  ]);
  ctx.y -= 4;
  const handedOverLabels = (data.itemsHandedOver || []).filter((r) => r.received).map((r) => r.item);
  const staticLabels = ['Keys', 'Charging Equipment', 'Warranty', 'Manual'];
  ctx.page.drawText('Items Handed Over:', { x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.bold, color: COLORS.dark });
  ctx.y -= 16;
  let cbX = PDF_MARGIN;
  for (const label of staticLabels) {
    drawCheckbox(ctx, cbX, ctx.y - 8, handedOverLabels.some((l) => l.toLowerCase().includes(label.toLowerCase())), label, 9);
    cbX += 120;
  }
  ctx.y -= 22;

  ctx.y -= 8;
  ctx = ensureSpace(ctx, 120);
  drawSectionTitle(ctx, 'Important Notes');
  IMPORTANT_NOTES.forEach((note, i) => {
    ctx = ensureSpace(ctx, 16);
    ctx.page.drawText(`${i + 1}. ${note}`, { x: PDF_MARGIN, y: ctx.y, size: 8.5, font: ctx.bold, color: COLORS.dark });
    ctx.y -= 14;
  });

  ctx.y -= 10;
  ctx = ensureSpace(ctx, 60);
  drawSectionTitle(ctx, 'Acknowledgement');
  ctx = wrapText(ctx, 'The customer confirms receipt of the vehicle and items listed above, subject to the applicable Sales Agreement and warranty terms.', PDF_MARGIN, ctx.y, 9.5, PDF_CONTENT_WIDTH);
  ctx.y -= 24;

  ctx = ensureSpace(ctx, 100);
  drawSignatureBlock(
    ctx,
    { heading: 'CUSTOMER / AUTHORIZED REPRESENTATIVE', name: data.customerName, showStamp: true },
    { heading: company.legalName.toUpperCase(), name: data.sellerSignerName, showStamp: true },
  );

  return saveBuffer(doc);
}
