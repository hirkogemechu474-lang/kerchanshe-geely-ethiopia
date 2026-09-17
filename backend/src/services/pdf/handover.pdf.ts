import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawFieldTable,
  drawLabelValue, drawCheckbox, drawSignatureBlock, ensureSpace, wrapText, embedSignatureImage,
  PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, COLORS, dateValue, formatBrandModel, PagedContext,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface HandoverItemRow {
  item: string;
  qty: string;
  remarks: string;
  received: boolean;
}

export interface InspectionRow {
  checkpoint: string;
  ok: boolean;
  na: boolean;
  remarks: string;
}

export interface EvGuidanceRow {
  topic: string;
  explained: boolean;
}

// Seed rows used when an order has no saved checklist yet — same fixed
// membership as the printed form (see OrderHandoverPanel.tsx, which seeds
// these into SalesOrder.itemsHandedOver/inspectionChecklist/evGuidanceChecklist
// on first open).
export const DEFAULT_ITEMS_HANDED_OVER: HandoverItemRow[] = [
  { item: 'GEELY Vehicle', qty: '1', remarks: 'As specified above', received: false },
  { item: 'Vehicle Keys', qty: '', remarks: '', received: false },
  { item: 'Charging Cable / Equipment', qty: '', remarks: '', received: false },
  { item: "Owner's Manual / User Guide", qty: '', remarks: '', received: false },
  { item: 'Warranty Documents', qty: '', remarks: '', received: false },
  { item: 'Registration / Related Documents', qty: '', remarks: 'If applicable', received: false },
  { item: 'Other Accessories / Documents', qty: '', remarks: '', received: false },
];

export const DEFAULT_INSPECTION_CHECKLIST: InspectionRow[] = [
  { checkpoint: 'Exterior body & paint', ok: false, na: false, remarks: '' },
  { checkpoint: 'Windows / mirrors / lights', ok: false, na: false, remarks: '' },
  { checkpoint: 'Tyres & wheels', ok: false, na: false, remarks: '' },
  { checkpoint: 'Interior condition', ok: false, na: false, remarks: '' },
  { checkpoint: 'Dashboard / warning indicators', ok: false, na: false, remarks: '' },
  { checkpoint: 'Charging port & equipment', ok: false, na: false, remarks: '' },
  { checkpoint: 'Keys / remote', ok: false, na: false, remarks: '' },
  { checkpoint: 'VIN / chassis number & odometer', ok: false, na: false, remarks: '' },
];

export const DEFAULT_EV_GUIDANCE_CHECKLIST: EvGuidanceRow[] = [
  { topic: 'Vehicle operation', explained: false },
  { topic: 'Charging procedure', explained: false },
  { topic: 'Charging equipment / cable', explained: false },
  { topic: 'Key safety features', explained: false },
  { topic: 'Recommended maintenance', explained: false },
  { topic: 'Warranty / service process', explained: false },
];

export interface HandoverPdfData {
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  handoverDate: string;
  deliveryNoteNo?: string | null;
  invoiceNo?: string | null;
  quotationNo?: string | null;
  salesType?: string | null;
  deliveryLocation?: string | null;
  salesExecutiveName?: string | null;
  customerPhone?: string | null;
  customerTin?: string | null;
  customerAddress?: string | null;
  customerTitle?: string | null;
  color?: string | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  vehicleVariant?: string | null;
  vin?: string | null;
  motorBatterySerialNo?: string | null;
  odometerAtDelivery?: number | null;
  registrationNumber?: string | null;
  registeredAt?: Date | string | null;
  pdiComplete?: boolean;
  itemsHandedOver?: HandoverItemRow[] | null;
  inspectionChecklist?: InspectionRow[] | null;
  evGuidanceChecklist?: EvGuidanceRow[] | null;
  handoverDamageNotes?: string | null;
  handoverOutstandingItems?: string | null;
  handoverResponsiblePerson?: string | null;
  handoverExpectedCompletionDate?: Date | string | null;
  handoverSignedAt?: Date | string | null;
  countersignedByName?: string | null;
  countersignedByTitle?: string | null;
  countersignedAt?: Date | string | null;
  customerSignatureUrl?: string | null;
  managerSignatureUrl?: string | null;
  managerStampUrl?: string | null;
  customerStampUrl?: string | null;
}

function drawItemsHandedOverTable(ctx: PagedContext, rows: HandoverItemRow[]): PagedContext {
  const rowH = 20;
  const cols = { no: 24, item: 220, qty: 50, remarks: 0, received: 60 };
  cols.remarks = PDF_CONTENT_WIDTH - cols.no - cols.item - cols.qty - cols.received;
  const xNo = PDF_MARGIN;
  const xItem = xNo + cols.no;
  const xQty = xItem + cols.item;
  const xRemarks = xQty + cols.qty;
  const xReceived = xRemarks + cols.remarks;

  ctx = ensureSpace(ctx, rowH * (rows.length + 1));
  const headerY = ctx.y - rowH + 4;
  ctx.page.drawRectangle({ x: PDF_MARGIN, y: headerY, width: PDF_CONTENT_WIDTH, height: rowH, color: COLORS.lightGray });
  ctx.page.drawText('NO.', { x: xNo + 4, y: headerY + 4, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('ITEM', { x: xItem + 4, y: headerY + 4, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('QTY', { x: xQty + 4, y: headerY + 4, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('REMARKS', { x: xRemarks + 4, y: headerY + 4, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('RECEIVED', { x: xReceived + 4, y: headerY + 4, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.y = headerY;

  rows.forEach((row, i) => {
    const rowTop = ctx.y;
    ctx.page.drawLine({ start: { x: PDF_MARGIN, y: rowTop }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: rowTop }, thickness: 0.5, color: COLORS.border });
    ctx.page.drawText(String(i + 1), { x: xNo + 4, y: rowTop - 15, size: 9, font: ctx.font, color: COLORS.dark });
    ctx.page.drawText(row.item, { x: xItem + 4, y: rowTop - 15, size: 9, font: ctx.bold, color: COLORS.dark });
    ctx.page.drawText(row.qty || '—', { x: xQty + 4, y: rowTop - 15, size: 9, font: ctx.font, color: COLORS.dark });
    ctx.page.drawText(row.remarks || '', { x: xRemarks + 4, y: rowTop - 15, size: 9, font: ctx.font, color: COLORS.dark });
    drawCheckbox(ctx, xReceived + 20, rowTop - 17, row.received, undefined, 9);
    ctx.y = rowTop - rowH;
  });
  ctx.page.drawLine({ start: { x: PDF_MARGIN, y: ctx.y + 4 }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: ctx.y + 4 }, thickness: 0.5, color: COLORS.border });
  return ctx;
}

function drawInspectionTable(ctx: PagedContext, rows: InspectionRow[]): PagedContext {
  const rowH = 22;
  const cols = { checkpoint: 220, ok: 50, na: 50, remarks: 0 };
  cols.remarks = PDF_CONTENT_WIDTH - cols.checkpoint - cols.ok - cols.na;
  const xCheck = PDF_MARGIN;
  const xOk = xCheck + cols.checkpoint;
  const xNa = xOk + cols.ok;
  const xRemarks = xNa + cols.na;

  ctx = ensureSpace(ctx, rowH * (rows.length + 1));
  const headerY = ctx.y - rowH + 4;
  ctx.page.drawRectangle({ x: PDF_MARGIN, y: headerY, width: PDF_CONTENT_WIDTH, height: rowH, color: COLORS.lightGray });
  ctx.page.drawText('CHECK POINT', { x: xCheck + 4, y: headerY + 6, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('OK', { x: xOk + 4, y: headerY + 6, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('N/A', { x: xNa + 4, y: headerY + 6, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawText('REMARKS', { x: xRemarks + 4, y: headerY + 6, size: 8, font: ctx.bold, color: COLORS.dark });
  ctx.y = headerY;

  for (const row of rows) {
    const rowTop = ctx.y;
    ctx.page.drawLine({ start: { x: PDF_MARGIN, y: rowTop }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: rowTop }, thickness: 0.5, color: COLORS.border });
    ctx.page.drawText(row.checkpoint, { x: xCheck + 4, y: rowTop - 16, size: 9, font: ctx.font, color: COLORS.dark });
    drawCheckbox(ctx, xOk + 14, rowTop - 18, row.ok, undefined, 9);
    drawCheckbox(ctx, xNa + 14, rowTop - 18, row.na, undefined, 9);
    ctx.page.drawText(row.remarks || '', { x: xRemarks + 4, y: rowTop - 16, size: 9, font: ctx.font, color: COLORS.dark });
    ctx.y = rowTop - rowH;
  }
  ctx.page.drawLine({ start: { x: PDF_MARGIN, y: ctx.y + 4 }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: ctx.y + 4 }, thickness: 0.5, color: COLORS.border });
  return ctx;
}

export async function generateHandoverPdf(data: HandoverPdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  const managerSignatureImage = await embedSignatureImage(doc.doc, data.managerSignatureUrl);
  const customerSignatureImage = await embedSignatureImage(doc.doc, data.customerSignatureUrl);
  const managerStampImage = await embedSignatureImage(doc.doc, data.managerStampUrl);
  const customerStampImage = await embedSignatureImage(doc.doc, data.customerStampUrl);
  let ctx = addPage(doc);
  const title = 'GEELY ELECTRIC VEHICLE DELIVERY & HANDOVER NOTE';
  ctx = await drawHeaderFooter(ctx, title, company);

  ctx.y = PDF_HEADER_CONTENT_Y;
  drawLabelValue(ctx, 'Delivery Note No.', data.deliveryNoteNo || '—', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Delivery Date', dateValue(data.handoverDate || data.handoverSignedAt || new Date()), PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Sales Agreement No.', data.orderNo, PDF_MARGIN + 440, ctx.y);
  ctx.y -= 40;

  drawLabelValue(ctx, 'Invoice No.', data.invoiceNo || '—', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Quotation No.', data.quotationNo || '—', PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Sales Type', data.salesType === 'order' ? 'Order' : 'Showroom / Stock', PDF_MARGIN + 440, ctx.y);
  ctx.y -= 40;

  drawLabelValue(ctx, 'Delivery Location', data.deliveryLocation || '—', PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Sales Executive', data.salesExecutiveName || '—', PDF_MARGIN + 220, ctx.y);
  ctx.y -= 36;

  ctx = ensureSpace(ctx, 110);
  drawSectionTitle(ctx, '1. Customer Details');
  ctx = drawFieldTable(ctx, [
    ['Name / Company', data.customerName || '—'],
    ['TIN', data.customerTin || '—'],
    ['Address', data.customerAddress || '—'],
    ['Tel.', data.customerPhone || '—'],
  ]);
  ctx.y -= 14;

  const registrationStatus = data.registeredAt ? 'Completed' : data.registrationNumber ? 'Completed' : 'Pending';
  ctx = ensureSpace(ctx, 180);
  drawSectionTitle(ctx, '2. Vehicle Details');
  ctx = drawFieldTable(ctx, [
    ['Brand / Model', formatBrandModel(data.vehicleModel)],
    ['Variant / Battery', data.vehicleVariant || '—'],
    ['Colour', `Exterior: ${data.exteriorColor || data.color || '—'}  Interior: ${data.interiorColor || '—'}`],
    ['VIN / Chassis No.', data.vin || '—'],
    ['Motor / Battery Serial No.', data.motorBatterySerialNo || '—'],
    ['Odometer at Delivery', data.odometerAtDelivery != null ? `${data.odometerAtDelivery} km` : '—'],
    ['Quantity', '1 Unit'],
    ['Vehicle Status', 'New'],
    ['Registration Status', registrationStatus],
    ['Pre-Delivery Inspection', data.pdiComplete ? 'Completed' : 'Pending'],
    ['Delivery Status', 'Ready for Handover'],
  ]);
  ctx.y -= 14;

  const itemsHandedOver = data.itemsHandedOver?.length ? data.itemsHandedOver : DEFAULT_ITEMS_HANDED_OVER;
  ctx = ensureSpace(ctx, 40 + itemsHandedOver.length * 20);
  drawSectionTitle(ctx, '3. Items Handed Over');
  ctx = drawItemsHandedOverTable(ctx, itemsHandedOver);
  ctx.y -= 16;

  ctx = ensureSpace(ctx, 50);
  drawSectionTitle(ctx, '4. Customer Pre-Handover Confirmation');
  ctx = wrapText(
    ctx,
    'Before taking delivery, the customer has been given the opportunity to check the vehicle, VIN/chassis number, mileage, keys, charging equipment, accessories and available documents. Any visible issue or missing item should be recorded on Page 2.',
    PDF_MARGIN, ctx.y, 9.5, PDF_CONTENT_WIDTH,
  );

  // ── Page 2: Inspection, EV Guidance, Remarks, Final Acknowledgement ─────
  ctx = addPage(doc);
  ctx = await drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;

  const inspectionChecklist = data.inspectionChecklist?.length ? data.inspectionChecklist : DEFAULT_INSPECTION_CHECKLIST;
  drawSectionTitle(ctx, '5. Vehicle Inspection & Condition');
  ctx = drawInspectionTable(ctx, inspectionChecklist);
  ctx.y -= 16;

  const evGuidance = data.evGuidanceChecklist?.length ? data.evGuidanceChecklist : DEFAULT_EV_GUIDANCE_CHECKLIST;
  ctx = ensureSpace(ctx, 40 + evGuidance.length * 18);
  drawSectionTitle(ctx, '6. EV Handover & Customer Guidance');
  for (const row of evGuidance) {
    ctx = ensureSpace(ctx, 18);
    drawCheckbox(ctx, PDF_MARGIN + 220, ctx.y - 8, row.explained, 'Explained', 9);
    ctx.page.drawText(row.topic, { x: PDF_MARGIN, y: ctx.y, size: 9.5, font: ctx.bold, color: COLORS.dark });
    ctx.y -= 18;
  }
  ctx.y -= 4;
  ctx = ensureSpace(ctx, 30);
  ctx = wrapText(
    ctx,
    'EV NOTE: Driving range and charging time can vary with speed, weather, terrain, load, traffic, tyre pressure, driving style, charging conditions and use of heating or air conditioning.',
    PDF_MARGIN, ctx.y, 8.5, PDF_CONTENT_WIDTH,
  );
  ctx.y -= 18;

  ctx = ensureSpace(ctx, 100);
  drawSectionTitle(ctx, '7. Remarks / Outstanding Items');
  ctx = drawFieldTable(ctx, [
    ['Visible Damage / Shortage', data.handoverDamageNotes || '—'],
    ['Outstanding Item(s)', data.handoverOutstandingItems || '—'],
    ['Action / Responsible Person', data.handoverResponsiblePerson || '—'],
    ['Expected Completion Date', dateValue(data.handoverExpectedCompletionDate)],
  ]);
  ctx.y -= 18;

  ctx = ensureSpace(ctx, 60);
  drawSectionTitle(ctx, '8. Final Acknowledgement');
  ctx = wrapText(
    ctx,
    'I confirm that the vehicle and items listed in this Delivery Note have been handed over / received, and that the vehicle was available for inspection at the time of delivery. The vehicle remains subject to the applicable Sales Agreement and GEELY/manufacturer warranty terms.',
    PDF_MARGIN, ctx.y, 9.5, PDF_CONTENT_WIDTH,
  );
  ctx.y -= 24;

  ctx = ensureSpace(ctx, 90);
  drawSignatureBlock(
    ctx,
    {
      heading: `FOR ${company.legalName.toUpperCase()}`,
      name: data.countersignedByName,
      title: data.countersignedByTitle,
      signatureImage: managerSignatureImage ?? undefined,
      stampImage: managerStampImage ?? undefined,
      date: data.countersignedAt ? new Date(data.countersignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    },
    {
      heading: 'CUSTOMER / AUTHORIZED REPRESENTATIVE',
      name: data.customerName,
      title: data.customerTitle,
      signatureImage: customerSignatureImage ?? undefined,
      stampImage: customerStampImage ?? undefined,
      date: data.handoverSignedAt ? new Date(data.handoverSignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    },
  );

  return saveBuffer(doc);
}
