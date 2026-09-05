import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawLabelValue,
  drawFieldTable, drawCheckbox, drawSignatureBlock, ensureSpace, wrapText,
  PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, COLORS, dateValue, fillValue,
  formatBrandModel, PagedContext, embedSignatureImage,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface SalesAgreementPdfData {
  orderNo: string; // printed as Contract No.
  customerName: string;
  vehicleModel: string;
  totalPrice: number;
  customerPhone?: string | null;
  customerEmail?: string | null;
  color?: string | null; // legacy fallback if exteriorColor isn't set
  exteriorColor?: string | null;
  interiorColor?: string | null;
  orderDate?: Date | string | null;
  salesType?: string | null;
  vehicleType?: string | null;
  vin?: string | null;
  motorBatterySerialNo?: string | null;
  accessoriesDescription?: string | null;
  proformaInvoiceNo?: string | null;
  proformaInvoiceDate?: Date | string | null;
  vatAmount?: number | null;
  registrationCharge?: number | null;
  accessoriesAmount?: number | null;
  purchaserTin?: string | null;
  purchaserAddress?: string | null;
  purchaserAuthorizedRep?: string | null;
  sellerAuthorizedRep?: string | null;
  depositAmount?: number | null;
  depositDueDate?: Date | string | null;
  otherPaymentAmount?: number | null;
  otherPaymentNote?: string | null;
  otherPaymentDueDate?: Date | string | null;
  estimatedDeliveryDate?: Date | string | null;
  deliveryLocation?: string | null;
  countersignedByName?: string | null;
  countersignedAt?: Date | string | null;
  customerSignatureUrl?: string | null;
  managerSignatureUrl?: string | null;
}

function paragraphs(ctx: PagedContext, texts: string[], size = 9.5): PagedContext {
  for (const p of texts) {
    ctx = ensureSpace(ctx, 34);
    ctx = wrapText(ctx, p, PDF_MARGIN, ctx.y, size, PDF_CONTENT_WIDTH);
    ctx.y -= 10;
  }
  return ctx;
}

function clauseHeading(ctx: PagedContext, text: string): PagedContext {
  ctx = ensureSpace(ctx, 26);
  ctx.page.drawText(text, { x: PDF_MARGIN, y: ctx.y, size: 10.5, font: ctx.bold, color: COLORS.dark });
  ctx.y -= 16;
  return ctx;
}

export async function generateSalesAgreementPdf(data: SalesAgreementPdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  const customerSignatureImage = await embedSignatureImage(doc.doc, data.customerSignatureUrl);
  const managerSignatureImage = await embedSignatureImage(doc.doc, data.managerSignatureUrl);
  let ctx = addPage(doc);
  const title = 'GEELY ELECTRIC VEHICLE SALES AGREEMENT';
  drawHeaderFooter(ctx, title, company);

  // ── Page 1: header, intro, Parties ──────────────────────────────────────
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawLabelValue(ctx, 'Contract No.', data.orderNo, PDF_MARGIN, ctx.y);
  drawLabelValue(ctx, 'Sales Type', data.salesType === 'order' ? 'Order / To Be Imported' : 'Showroom / In Stock', PDF_MARGIN + 220, ctx.y);
  drawLabelValue(ctx, 'Date', dateValue(data.orderDate ?? new Date()), PDF_MARGIN + 440, ctx.y);
  ctx.y -= 30;

  ctx = paragraphs(ctx, [
    'This Agreement is a practical sales contract for the purchase of a new GEELY electric vehicle (EV) from ' +
      `${company.legalName} in Ethiopia. It should be read together with the Proforma Invoice / Vehicle Specification Sheet attached to it.`,
  ]);
  ctx.y -= 6;

  ctx = ensureSpace(ctx, 140);
  drawSectionTitle(ctx, '1. Parties');
  ctx = drawFieldTable(ctx, [
    ['Seller', company.legalName],
    ['Seller TIN', company.tin || '—'],
    ['Seller Address', company.address],
    ['Seller Tel / Email', `${company.phone || '—'} / ${company.email || '—'}`],
    ['Purchaser', data.customerName || '—'],
    ['Purchaser TIN', data.purchaserTin || '—'],
    ['Purchaser Address', data.purchaserAddress || '—'],
    ['Purchaser Tel / Email', `${data.customerPhone || '—'} / ${data.customerEmail || '—'}`],
    ['Purchaser Authorized Rep.', data.purchaserAuthorizedRep || '—'],
  ]);

  // ── Page 2: Vehicle & Sales Details, Price ──────────────────────────────
  ctx = addPage(doc);
  drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawSectionTitle(ctx, '2. Vehicle and Sales Details');
  const exteriorColor = data.exteriorColor || data.color || '—';
  ctx = drawFieldTable(ctx, [
    ['Brand / Model', formatBrandModel(data.vehicleModel)],
    ['Vehicle Type', data.vehicleType || 'BEV'],
    ['Model Year', dateValue(data.orderDate) !== '—' ? String(new Date(data.orderDate ?? Date.now()).getFullYear()) : '—'],
    ['Exterior / Interior Colour', `${exteriorColor} / ${data.interiorColor || '—'}`],
    ['Battery / Powertrain Specification', 'As stated in attached specification sheet / Proforma Invoice'],
    ['VIN / Chassis No.', data.vin || (data.salesType === 'order' ? '(to be completed on allocation)' : '—')],
    ['Motor / Battery Serial No.', data.motorBatterySerialNo || '—'],
    ['Quantity', '1 unit, unless otherwise stated in the Proforma Invoice'],
    ['Accessories / Inclusions', data.accessoriesDescription || '—'],
    ['Proforma Invoice No. / Date', `${data.proformaInvoiceNo || '—'} / ${dateValue(data.proformaInvoiceDate)}`],
  ]);
  ctx.y -= 4;
  ctx = paragraphs(ctx, [
    'For an order sale, the VIN/chassis number may be completed when the vehicle is allocated to the Purchaser. The final vehicle must materially match the agreed model and specification.',
  ]);

  ctx.y -= 6;
  ctx = ensureSpace(ctx, 140);
  drawSectionTitle(ctx, '3. Price and What It Includes');
  ctx = paragraphs(ctx, ['The total purchase price is the amount shown in the signed Proforma Invoice / Vehicle Specification Sheet. That document forms part of this Agreement.']);
  ctx = drawFieldTable(ctx, [
    ['Vehicle Price', fillValue((data.totalPrice ?? 0) - (data.vatAmount ?? 0) - (data.registrationCharge ?? 0) - (data.accessoriesAmount ?? 0))],
    ['VAT / Applicable Taxes and Charges', fillValue(data.vatAmount)],
    ['Registration / Plate / Other Government Charges', fillValue(data.registrationCharge)],
    ['Accessories / Optional Items', fillValue(data.accessoriesAmount)],
    ['TOTAL PAYABLE', fillValue(data.totalPrice)],
  ]);
  ctx.y -= 4;
  ctx = paragraphs(ctx, [
    "Unless expressly included in the Proforma Invoice, government registration/plate fees and optional accessories are payable by the Purchaser. The Seller will identify material additional charges before they are incurred.",
  ]);

  // ── Page 3: Payment + bank details, Order Sales & Price Changes ─────────
  ctx = addPage(doc);
  drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawSectionTitle(ctx, '4. Payment');
  ctx = paragraphs(ctx, ["The Purchaser shall pay according to the schedule below. Payment is considered made when cleared funds are received in the Seller's designated bank account."]);
  ctx = drawFieldTable(ctx, [
    ['Booking / Deposit', `${fillValue(data.depositAmount)}${data.depositDueDate ? ` · due ${dateValue(data.depositDueDate)}` : ''}`],
    ['Balance', `${fillValue(data.totalPrice != null && data.depositAmount != null ? data.totalPrice - data.depositAmount - (data.otherPaymentAmount ?? 0) : null)} · Before delivery / as agreed`],
    ['Other', data.otherPaymentAmount ? `${fillValue(data.otherPaymentAmount)}${data.otherPaymentNote ? ` — ${data.otherPaymentNote}` : ''}${data.otherPaymentDueDate ? ` · due ${dateValue(data.otherPaymentDueDate)}` : ''}` : '—'],
  ]);
  ctx.y -= 4;
  ctx.page.drawText('Bank Details', { x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.bold, color: COLORS.dark });
  ctx.y -= 14;
  ctx = drawFieldTable(ctx, [
    [company.legalName, ''],
    ['Bank', company.bank.name || '—'],
    ['Account No.', company.bank.accountNumber || '—'],
    ['Branch', company.bank.branch || '—'],
  ]);
  ctx.y -= 4;
  ctx = paragraphs(ctx, [
    "For a showroom vehicle, the Seller may reserve the identified vehicle after receiving the agreed deposit. For an order vehicle, the deposit confirms the Purchaser's order subject to the agreed specification, price and delivery terms.",
  ]);

  ctx.y -= 6;
  ctx = ensureSpace(ctx, 160);
  drawSectionTitle(ctx, '5. Order Sales and Price Changes');
  ctx = paragraphs(ctx, [
    `For an order sale, the estimated delivery date is ${dateValue(data.estimatedDeliveryDate)}. The Seller will keep the Purchaser reasonably informed of material changes to the expected arrival or allocation.`,
    'If, before delivery, government taxes/charges, mandatory import costs, foreign-exchange restrictions, freight costs, or other external costs materially change the landed cost of an ordered vehicle, the Seller may propose a corresponding price adjustment. The Purchaser may accept the revised price or, if the change is material and no alternative is agreed, cancel the order and receive the refundable balance of amounts paid, subject to documented non-refundable third-party costs expressly agreed in writing.',
    "No material change to the ordered model or key specification will be made without the Purchaser's written acceptance, unless the change is a minor improvement that does not materially reduce the vehicle's agreed functionality or value.",
  ]);

  // ── Page 4: Delivery/Inspection, EV Handover, Warranty ──────────────────
  ctx = addPage(doc);
  drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawSectionTitle(ctx, '6. Delivery, Inspection and Acceptance');
  ctx = paragraphs(ctx, [
    'Showroom sale: After full payment and completion of required registration/delivery formalities, the Seller will make the vehicle available for collection within the period stated in the Proforma Invoice or otherwise agreed in writing.',
    'Order sale: The Seller will notify the Purchaser when the vehicle is available. Delivery will take place after the agreed balance and required formalities have been completed.',
    `Delivery location: ${data.deliveryLocation || `${company.legalName}'s showroom/premises in Addis Ababa`}.`,
    'At handover, the parties will complete a Delivery & Inspection Checklist covering the vehicle condition, VIN, mileage, accessories, keys, charging equipment and available documents. The Purchaser should raise visible damage or missing items at handover. Acceptance of the vehicle does not remove the Purchaser\'s rights under the applicable warranty.',
    'Ownership and risk pass to the Purchaser upon delivery and acceptance, provided the purchase price has been fully paid. If the vehicle remains unpaid, ownership does not pass unless the parties expressly agree otherwise in writing.',
  ]);

  ctx.y -= 6;
  ctx = ensureSpace(ctx, 100);
  drawSectionTitle(ctx, '7. EV-Specific Handover');
  ctx = paragraphs(ctx, [
    "The Seller will, where applicable, provide a basic handover covering vehicle operation, charging procedures, charging equipment, key safety features and recommended maintenance. The Purchaser is responsible for using the vehicle and charging equipment in accordance with the manufacturer's instructions.",
    'The Purchaser acknowledges that EV range can vary with driving speed, temperature, terrain, load, traffic, tyre pressure, use of heating/air conditioning and charging conditions. Advertised range is not a guarantee of a fixed real-world distance.',
  ]);

  ctx.y -= 6;
  ctx = ensureSpace(ctx, 160);
  drawSectionTitle(ctx, '8. Warranty and Service');
  ctx = paragraphs(ctx, [
    'The vehicle is covered by the applicable GEELY/manufacturer warranty as stated in the warranty booklet and applicable warranty terms delivered with the vehicle. The Seller will provide or arrange warranty service through its authorized service arrangements in Ethiopia.',
    "Warranty coverage may include vehicle components and the high-voltage battery according to the manufacturer's applicable warranty terms. Battery capacity naturally changes with use and age; any battery performance threshold covered by warranty is the threshold stated by the manufacturer.",
    'Warranty does not cover damage or failure caused by accident, misuse, unauthorized modification or repair, improper charging, use outside the manufacturer\'s instructions, neglect of scheduled maintenance, or other exclusions stated in the manufacturer\'s warranty terms.',
    'The Seller is not liable for indirect or consequential losses such as loss of business, income or vehicle use, except to the extent such limitation is not permitted by applicable Ethiopian law.',
  ]);

  // ── Page 5: remaining clauses + Signatures ──────────────────────────────
  ctx = addPage(doc);
  drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  ctx = clauseHeading(ctx, '9. Purchaser Responsibilities');
  ctx = paragraphs(ctx, [
    'The Purchaser shall provide accurate identification and registration information, make payments on time, collect the vehicle when notified, maintain the vehicle as recommended, and use approved charging equipment and safe charging practices. The Purchaser is responsible for registration, insurance and lawful use of the vehicle after delivery unless otherwise stated in writing.',
  ]);
  ctx = clauseHeading(ctx, '10. Cancellation, Default and Refunds');
  ctx = paragraphs(ctx, [
    'If the Purchaser does not make a payment by the agreed due date, the Seller may give written notice and allow a reasonable period to cure the default. If the default continues, the Seller may cancel the sale/order and apply the deposit toward reasonable, documented costs or losses to the extent permitted by Ethiopian law.',
    'If the Seller cannot supply the ordered vehicle for reasons within the Seller\'s responsibility and the parties cannot agree on a reasonable alternative, the Purchaser may cancel and receive a refund of amounts paid, subject to any lawful deductions expressly agreed in writing.',
    "A showroom vehicle that has been delivered and accepted generally cannot be returned merely because the Purchaser changes their mind, unless the Seller agrees otherwise or applicable law provides a return/right of cancellation.",
  ]);
  ctx = clauseHeading(ctx, '11. Force Majeure');
  ctx = paragraphs(ctx, [
    'Neither party is responsible for delay caused by events beyond its reasonable control, including natural disasters, war, serious transport disruption, government restrictions, import restrictions, banking or foreign-exchange restrictions, epidemics, or other comparable events. The affected party will notify the other party and take reasonable steps to reduce the delay. If the event continues for more than 90 consecutive days, either party may request termination and the parties will settle amounts due fairly and in accordance with applicable law.',
  ]);
  ctx = clauseHeading(ctx, '12. Compliance and Integrity');
  ctx = paragraphs(ctx, [
    'The parties will act honestly and comply with applicable Ethiopian laws, including applicable anti-bribery and anti-corruption requirements. No unofficial payment or facilitation payment is required or authorized under this Agreement.',
  ]);
  ctx = clauseHeading(ctx, '13. Complaints and Dispute Resolution');
  ctx = paragraphs(ctx, [
    "The parties will first try in good faith to resolve any complaint or dispute through the Seller's customer-service/management process. If it cannot be resolved amicably, the dispute may be referred to the competent court or other lawful forum in Ethiopia. Ethiopian law governs this Agreement.",
  ]);
  ctx = clauseHeading(ctx, '14. General');
  ctx = paragraphs(ctx, [
    'The Proforma Invoice, Vehicle Specification Sheet, Delivery & Inspection Checklist, and manufacturer warranty documents referred to in this Agreement form part of the contractual documents. If there is a conflict, the signed Agreement and then the specific vehicle/price documents will apply, subject to mandatory Ethiopian law.',
    'Any amendment must be in writing and signed by authorized representatives of both parties. If one provision is held invalid, the remaining provisions remain effective. Notices may be delivered by hand, email or other agreed written means to the contact details stated above.',
    'This Agreement replaces prior discussions about the same vehicle to the extent they conflict with this signed Agreement.',
  ]);

  ctx.y -= 10;
  ctx = ensureSpace(ctx, 160);
  drawSectionTitle(ctx, '15. Signatures');
  ctx = paragraphs(ctx, ['By signing below, the parties confirm that they have read and understood this Agreement and the attached vehicle/price documents and agree to them.']);
  ctx.y -= 10;
  drawSignatureBlock(
    ctx,
    {
      heading: `FOR ${company.legalName.toUpperCase()}`,
      name: data.sellerAuthorizedRep,
      showStamp: true,
      signatureImage: managerSignatureImage,
    },
    {
      heading: 'FOR THE PURCHASER',
      name: data.customerName,
      title: data.purchaserAuthorizedRep,
      showStamp: true,
      signatureImage: customerSignatureImage,
    },
  );
  ctx.y -= 30;
  ctx = ensureSpace(ctx, 90);
  ctx.page.drawText('Witness (optional):', { x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.bold, color: COLORS.dark });
  ctx.y -= 16;
  for (let i = 0; i < 3; i += 1) {
    ctx = ensureSpace(ctx, 18);
    ctx.page.drawText(`Name ____________________________  Signature ____________________________  Date ______________`, {
      x: PDF_MARGIN, y: ctx.y, size: 9, font: ctx.font, color: COLORS.dark,
    });
    ctx.y -= 18;
  }

  // ── Page 6: Recommended Attachments ─────────────────────────────────────
  ctx = addPage(doc);
  drawHeaderFooter(ctx, title, company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  ctx.page.drawText('Recommended Attachments (Annexes)', { x: PDF_MARGIN, y: ctx.y, size: 11, font: ctx.bold, color: COLORS.brandRed });
  ctx.y -= 24;
  const attachments = [
    'Proforma Invoice / Vehicle Specification Sheet',
    'Manufacturer Warranty Terms',
    'Delivery & Inspection Checklist',
    'Payment receipt(s)',
    'Other',
  ];
  for (const item of attachments) {
    ctx = ensureSpace(ctx, 20);
    drawCheckbox(ctx, PDF_MARGIN, ctx.y - 8, false, item, 10);
    ctx.y -= 22;
  }

  return saveBuffer(doc);
}
