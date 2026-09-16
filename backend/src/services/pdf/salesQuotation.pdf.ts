import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawTable,
  drawLabelValue, drawRightText, drawCheckbox, drawSignatureBlock, ensureSpace, wrapText,
  PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, COLORS, dateValue, fillValue,
  formatBrandModel, PagedContext, embedSignatureImage,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface QuotationPdfData {
  quotationNo: string;
  customerName: string;
  vehicleModel: string;
  totalPrice: number;
  reference?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerTin?: string | null;
  customerAddress?: string | null;
  vehicleYear?: number | string | null;
  vehicleColor?: string | null;
  vehicleVariant?: string | null;
  vehicleVin?: string | null;
  unitPrice?: number | null;
  quantity?: number | null;
  discountAmount?: number | null;
  vatAmount?: number | null;
  registrationCharge?: number | null;
  registrationResponsibility?: string | null;
  insuranceResponsibility?: string | null;
  chargingEquipmentDetails?: string | null;
  salesType?: string | null;
  salesExecutiveName?: string | null;
  depositAmount?: number | null;
  depositDueDate?: Date | string | null;
  balanceDueDate?: Date | string | null;
  deliveryLocation?: string | null;
  expectedHandoverNote?: string | null;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  validUntil?: Date | string | null;
  issuedAt?: Date | string | null;
  customerSignatureUrl?: string | null;
  customerSignedAt?: Date | string | null;
  managerSignatureUrl?: string | null;
  managerSignerName?: string | null;
  managerSignedAt?: Date | string | null;
}

function salesTypeLabel(salesType?: string | null): string {
  return salesType === 'order' ? 'Order' : 'Showroom / Stock';
}

function drawWhatsIncludedTable(ctx: PagedContext, data: QuotationPdfData) {
  const rowH = 22;
  const labelW = 220;
  const rows: Array<{ label: string; render: (x: number, y: number) => void }> = [
    { label: "GEELY vehicle & standard equipment", render: (x, y) => ctx.page.drawText('Included as specified above', { x, y, size: 9, font: ctx.font, color: COLORS.dark }) },
    { label: 'Manufacturer warranty', render: (x, y) => ctx.page.drawText('According to applicable GEELY warranty terms', { x, y, size: 9, font: ctx.font, color: COLORS.dark }) },
    { label: 'Pre-delivery inspection', render: (x, y) => ctx.page.drawText('Included', { x, y, size: 9, font: ctx.font, color: COLORS.dark }) },
    { label: 'Basic vehicle & EV charging handover', render: (x, y) => ctx.page.drawText('Included', { x, y, size: 9, font: ctx.font, color: COLORS.dark }) },
    { label: 'Charging equipment / accessories', render: (x, y) => ctx.page.drawText(data.chargingEquipmentDetails || '—', { x, y, size: 9, font: ctx.font, color: COLORS.dark }) },
    {
      label: 'Registration & number plate',
      render: (x, y) => {
        drawCheckbox(ctx, x, y - 1, data.registrationResponsibility === 'included', 'Included', 8);
        drawCheckbox(ctx, x + 90, y - 1, data.registrationResponsibility === 'customer', 'Customer responsibility', 8);
        drawCheckbox(ctx, x + 260, y - 1, data.registrationResponsibility === 'actual_cost', 'At actual cost', 8);
      },
    },
    {
      label: 'Insurance',
      render: (x, y) => {
        drawCheckbox(ctx, x, y - 1, data.insuranceResponsibility === 'included', 'Included', 8);
        drawCheckbox(ctx, x + 90, y - 1, data.insuranceResponsibility === 'customer', 'Customer responsibility', 8);
      },
    },
  ];

  for (const row of rows) {
    ctx = ensureSpace(ctx, rowH);
    ctx.page.drawLine({ start: { x: PDF_MARGIN, y: ctx.y }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: ctx.y }, thickness: 0.5, color: COLORS.border });
    ctx.page.drawText(row.label, { x: PDF_MARGIN + 6, y: ctx.y - 15, size: 9, font: ctx.bold, color: COLORS.dark });
    row.render(PDF_MARGIN + labelW, ctx.y - 15);
    ctx.y -= rowH;
  }
  ctx.page.drawLine({ start: { x: PDF_MARGIN, y: ctx.y }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: ctx.y }, thickness: 0.5, color: COLORS.border });
  return ctx;
}

const QUOTATION_CONDITIONS = [
  'This quotation is valid until the date shown above and is subject to vehicle availability and final confirmation.',
  "For an order vehicle, the delivery date is an estimate and may change due to shipping, customs, import, regulatory, banking/foreign-exchange or other events outside the Seller's reasonable control.",
  'Prices and applicable taxes/charges may change after the quotation validity period. For order sales, material changes in external import or government costs may require a revised quotation before delivery.',
  "The vehicle's final specification will be based on the allocated GEELY vehicle. EV driving range varies with speed, weather, terrain, load, traffic and use of heating or air conditioning.",
  'Warranty is provided under the applicable GEELY/manufacturer warranty terms.',
  'Registration, insurance and other charges are the customer\'s responsibility unless specifically included above.',
  'This quotation is not the final tax invoice. The final Sales Agreement and tax invoice will be issued as applicable.',
];

export async function generateSalesQuotationPdf(data: QuotationPdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  const customerSignatureImage = await embedSignatureImage(doc.doc, data.customerSignatureUrl);
  const managerSignatureImage = await embedSignatureImage(doc.doc, data.managerSignatureUrl);
  let ctx = addPage(doc);
  drawHeaderFooter(ctx, 'GEELY ELECTRIC VEHICLE SALES QUOTATION', company);

  ctx.y = PDF_HEADER_CONTENT_Y;
  drawLabelValue(ctx, 'Quotation No.', data.quotationNo, PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Sales Type', salesTypeLabel(data.salesType), PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Date', dateValue(data.issuedAt ?? new Date()), PDF_MARGIN + 440, ctx.y);
  ctx.y -= 34;

  drawLabelValue(ctx, 'Valid Until', dateValue(data.validUntil), PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Sales Executive', data.salesExecutiveName || '—', PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Currency', 'ETB', PDF_MARGIN + 440, ctx.y);
  ctx.y -= 34;

  drawLabelValue(ctx, 'Customer', data.customerName || '—', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'TIN', data.customerTin || '—', PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Phone', data.customerPhone || '—', PDF_MARGIN + 440, ctx.y);
  ctx.y -= 34;

  // Email and address each get a full-width row — the narrow columns used
  // above (~64-118px before the page edge) truncate a realistic email
  // address or a multi-part Ethiopian address when squeezed next to
  // another field on the same line.
  drawLabelValue(ctx, 'Email', data.customerEmail || '—', PDF_MARGIN, ctx.y);
  ctx.y -= 34;

  drawLabelValue(ctx, 'Address', data.customerAddress || '—', PDF_MARGIN, ctx.y);
  ctx.y -= 34;

  drawLabelValue(ctx, 'Brand / Model', data.vehicleModel ? formatBrandModel(data.vehicleModel) : 'General enquiry', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Variant / Battery', data.vehicleVariant || '—', PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Model Year', data.vehicleYear ? String(data.vehicleYear) : '—', PDF_MARGIN + 440, ctx.y);
  ctx.y -= 34;

  drawLabelValue(ctx, 'Colour', data.vehicleColor || '—', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'VIN / Chassis No.', data.vehicleVin || '—', PDF_MARGIN + 220, ctx.y);
  ctx.y -= 30;

  drawSectionTitle(ctx, 'Price Summary');
  const summaryX = PDF_MARGIN + PDF_CONTENT_WIDTH - 220;
  const rightCol = PDF_MARGIN + PDF_CONTENT_WIDTH;
  const vehiclePrice = (data.unitPrice ?? 0) * (data.quantity ?? 1);
  ctx.page.drawText('Vehicle Price', { x: summaryX, y: ctx.y, size: 9, font: ctx.font, color: COLORS.gray });
  drawRightText(ctx, fillValue(vehiclePrice), rightCol, ctx.y, 9, ctx.font, COLORS.dark);
  ctx.y -= 16;
  if (data.discountAmount) {
    ctx.page.drawText('Discount', { x: summaryX, y: ctx.y, size: 9, font: ctx.font, color: COLORS.gray });
    drawRightText(ctx, `- ${fillValue(data.discountAmount)}`, rightCol, ctx.y, 9, ctx.font, COLORS.gray);
    ctx.y -= 16;
  }
  if (data.vatAmount) {
    ctx.page.drawText('VAT / Applicable Taxes', { x: summaryX, y: ctx.y, size: 9, font: ctx.font, color: COLORS.gray });
    drawRightText(ctx, fillValue(data.vatAmount), rightCol, ctx.y, 9, ctx.font, COLORS.dark);
    ctx.y -= 16;
  }
  if (data.registrationCharge) {
    ctx.page.drawText('Registration / Other Charges', { x: summaryX, y: ctx.y, size: 9, font: ctx.font, color: COLORS.gray });
    drawRightText(ctx, fillValue(data.registrationCharge), rightCol, ctx.y, 9, ctx.font, COLORS.dark);
    ctx.y -= 16;
  }
  ctx.page.drawLine({ start: { x: summaryX, y: ctx.y + 4 }, end: { x: rightCol, y: ctx.y + 4 }, thickness: 1, color: COLORS.border });
  ctx.page.drawText('TOTAL PAYABLE', { x: summaryX, y: ctx.y, size: 11, font: ctx.bold, color: COLORS.dark });
  drawRightText(ctx, fillValue(data.totalPrice), rightCol, ctx.y, 11, ctx.bold, COLORS.dark);
  ctx.y -= 28;

  ctx = ensureSpace(ctx, 180);
  drawSectionTitle(ctx, "What's Included");
  ctx = drawWhatsIncludedTable(ctx, data);
  ctx.y -= 16;

  ctx = ensureSpace(ctx, 110);
  drawSectionTitle(ctx, 'Payment & Delivery');
  const balance = data.totalPrice != null && data.depositAmount != null ? data.totalPrice - data.depositAmount : null;
  drawTable(
    ctx,
    ['Payment', 'Amount / %', 'Due'],
    [
      ['Deposit / Booking', fillValue(data.depositAmount), data.depositDueDate ? dateValue(data.depositDueDate) : '—'],
      ['Balance', balance != null ? fillValue(balance) : '—', data.balanceDueDate ? dateValue(data.balanceDueDate) : 'Before delivery / as agreed'],
      ['Total', fillValue(data.totalPrice), '—'],
    ],
    [200, 152, 152],
  );
  ctx.y -= 10;
  const deliveryLine = data.salesType === 'order'
    ? `Order — expected arrival/handover: ${data.expectedHandoverNote || '—'}`
    : `Showroom / Stock — expected handover: ${data.expectedHandoverNote || '—'}`;
  ctx.page.drawText(deliveryLine, { x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.font, color: COLORS.dark });
  ctx.y -= 14;
  ctx.page.drawText(`Delivery location: ${data.deliveryLocation || '—'}`, { x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.font, color: COLORS.dark });
  ctx.y -= 20;

  // Page 2 — Quotation Conditions + Customer Confirmation, per the draft.
  ctx = addPage(doc);
  drawHeaderFooter(ctx, 'GEELY ELECTRIC VEHICLE SALES QUOTATION', company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawSectionTitle(ctx, 'Quotation Conditions');
  ctx.y -= 4;
  QUOTATION_CONDITIONS.forEach((clause, i) => {
    ctx = ensureSpace(ctx, 34);
    ctx = wrapText(ctx, `${i + 1}. ${clause}`, PDF_MARGIN, ctx.y, 9.5, PDF_CONTENT_WIDTH);
    ctx.y -= 10;
  });

  ctx.y -= 10;
  ctx = ensureSpace(ctx, 60);
  drawSectionTitle(ctx, 'Customer Confirmation');
  ctx.y -= 4;
  ctx = wrapText(
    ctx,
    'I/We have reviewed the vehicle, price, inclusions and notes above and would like to proceed, subject to the applicable Sales Agreement.',
    PDF_MARGIN, ctx.y, 9.5, PDF_CONTENT_WIDTH,
  );
  ctx.y -= 24;

  ctx = ensureSpace(ctx, 100);
  drawSignatureBlock(
    ctx,
    {
      heading: 'CUSTOMER',
      name: data.customerName,
      signatureImage: customerSignatureImage,
      date: data.customerSignedAt ? new Date(data.customerSignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    },
    {
      heading: company.legalName.toUpperCase(),
      name: data.managerSignerName || data.salesExecutiveName,
      showStamp: true,
      signatureImage: managerSignatureImage,
      date: data.managerSignedAt ? new Date(data.managerSignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    },
  );

  return saveBuffer(doc);
}
