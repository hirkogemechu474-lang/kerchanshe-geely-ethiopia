import fs from 'fs';
import path from 'path';
import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { Quotation } from '@prisma/client';
import { companyConfig, contactConfig } from '../../env';

// Formal dealer "Sales Quotation" PDF — mirrors salesAgreementPdf.ts's
// pdf-lib layout conventions (no native/browser dependency). Keep this file
// and its admin/ mirror byte-identical, same convention as
// salesAgreementPdf.ts (web needs its own copy for the public "display by
// link" self-service view — see web/app/api/public/quotations/[reference]/pdf/route.ts).
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const VAT_RATE = 0.15; // Ethiopia standard VAT rate

const DEFAULT_PAYMENT_TERMS = '30% Advance / 70% Before Delivery';
const DEFAULT_DELIVERY_TERMS = 'Within 10 Working Days';

// Layout constant the signature-stamping step (web-only — see
// stampSignatureOnQuotationPdf below) uses to place a drawn signature
// image without re-deriving the layout. Keep this file and its admin/
// mirror byte-identical, same convention as salesAgreementPdf.ts.
export const CUSTOMER_SIGNATURE_AREA = {
  lineX: MARGIN,
  lineY: 90,
  lineWidth: 220,
  maxImageHeight: 50,
};

export function computeQuotationTotals(unitPrice: number, quantity: number, discountAmount: number) {
  const vehiclePrice = unitPrice * quantity;
  const taxableAmount = Math.max(0, vehiclePrice - discountAmount);
  const vatAmount = taxableAmount * VAT_RATE;
  const totalPayable = taxableAmount + vatAmount;
  return { vehiclePrice, vatAmount, totalPayable };
}

function formatETB(value: number): string {
  return `ETB ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function readLogoBytes(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'logos', 'geely-logo.png'));
  } catch {
    return null;
  }
}

export async function buildSalesQuotationPdf(quotation: Quotation): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  // ── Dealer header ────────────────────────────────────────────────────────
  const logoBytes = readLogoBytes();
  let textX = MARGIN;
  if (logoBytes) {
    try {
      const logoImage = await doc.embedPng(logoBytes);
      const logoHeight = 42;
      const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
      page.drawImage(logoImage, { x: MARGIN, y: y - logoHeight + 6, width: logoWidth, height: logoHeight });
      textX = MARGIN + logoWidth + 14;
    } catch {
      // Corrupt/unreadable logo file — fall back to text-only header.
    }
  }
  page.drawText('GEELY AUTHORIZED DEALER', { x: textX, y, size: 13, font: bold });
  y -= 15;
  page.drawText(companyConfig.legal, { x: textX, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 12;
  page.drawText(
    `${contactConfig.address.hq}  ·  Tel: ${contactConfig.phone.sales}  ·  ${contactConfig.email.sales}  ·  TIN/VAT: ${companyConfig.taxId}`,
    { x: textX, y, size: 8, font, color: rgb(0.45, 0.45, 0.45) }
  );
  y -= 24;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: rgb(0.2, 0.2, 0.2) });
  y -= 26;

  page.drawText('SALES QUOTATION', { x: MARGIN, y, size: 18, font: bold });
  y -= 30;

  const row = (label: string, value: string) => {
    page.drawText(label, { x: MARGIN, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(value, { x: MARGIN + 150, y, size: 10, font: bold });
    y -= 18;
  };

  row('Quotation No.', quotation.quotationNo || '—');
  row('Date', formatDate(quotation.quotationGeneratedAt || new Date()));
  row('Valid Until', formatDate(quotation.quotationValidUntil));
  row('Customer', quotation.customerName);
  row('Sales Consultant', quotation.assignedTo || 'Not assigned');
  y -= 12;

  // ── Vehicle details table ────────────────────────────────────────────────
  const cols = [
    { label: 'Model', x: MARGIN, width: 150 },
    { label: 'Year', x: MARGIN + 150, width: 45 },
    { label: 'Color', x: MARGIN + 195, width: 70 },
    { label: 'Qty', x: MARGIN + 265, width: 35 },
    { label: 'Unit Price', x: MARGIN + 300, width: 90 },
    { label: 'Total', x: MARGIN + 390, width: 93 },
  ];

  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_WIDTH, height: 20, color: rgb(0.93, 0.93, 0.93) });
  for (const col of cols) {
    page.drawText(col.label, { x: col.x + 4, y: y + 2, size: 9, font: bold });
  }
  y -= 24;

  const unitPrice = quotation.unitPrice ?? 0;
  const quantity = quotation.quantity ?? 1;
  const discountAmount = quotation.discountAmount ?? 0;
  const { vehiclePrice, vatAmount, totalPayable } = computeQuotationTotals(unitPrice, quantity, discountAmount);
  const lineTotal = unitPrice * quantity;

  const rowValues = [
    quotation.vehicleModel || 'General enquiry',
    quotation.vehicleYear || '—',
    quotation.vehicleColor || '—',
    String(quantity),
    formatETB(unitPrice),
    formatETB(lineTotal),
  ];
  for (let i = 0; i < cols.length; i++) {
    page.drawText(rowValues[i], { x: cols[i].x + 4, y, size: 9, font });
  }
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  // ── Price summary ────────────────────────────────────────────────────────
  page.drawText('Price Summary', { x: MARGIN, y, size: 12, font: bold });
  y -= 20;

  const summaryRow = (label: string, value: string, emphasize = false) => {
    page.drawText(label, { x: MARGIN, y, size: 10, font: emphasize ? bold : font });
    const valueFont = emphasize ? bold : font;
    const valueSize = emphasize ? 12 : 10;
    const valueWidth = valueFont.widthOfTextAtSize(value, valueSize);
    page.drawText(value, { x: PAGE_WIDTH - MARGIN - valueWidth, y, size: valueSize, font: valueFont });
    y -= emphasize ? 22 : 18;
  };

  summaryRow('Vehicle Price', formatETB(vehiclePrice));
  summaryRow('Discount', discountAmount > 0 ? `(${formatETB(discountAmount)})` : formatETB(0));
  summaryRow('VAT (15%)', formatETB(quotation.vatAmount ?? vatAmount));
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;
  summaryRow('TOTAL PAYABLE', formatETB(totalPayable), true);
  y -= 10;

  // ── Terms ─────────────────────────────────────────────────────────────────
  const termsLines = [
    `Payment Terms: ${quotation.paymentTerms || DEFAULT_PAYMENT_TERMS}`,
    `Delivery: ${quotation.deliveryTerms || DEFAULT_DELIVERY_TERMS}`,
    'Warranty: As per Geely warranty policy.',
  ];
  for (const line of termsLines) {
    page.drawText(line, { x: MARGIN, y, size: 9, font, color: rgb(0.25, 0.25, 0.25) });
    y -= 15;
  }
  y -= 8;

  for (const line of wrapText(
    'Note: This quotation is subject to vehicle availability and the terms and conditions of the dealer.',
    font, 8, CONTENT_WIDTH
  )) {
    page.drawText(line, { x: MARGIN, y, size: 8, font, color: rgb(0.45, 0.45, 0.45) });
    y -= 12;
  }
  y -= 14;

  page.drawText('Thank you for choosing Geely.', { x: MARGIN, y, size: 10, font: bold });

  const sigY = CUSTOMER_SIGNATURE_AREA.lineY;
  page.drawLine({
    start: { x: CUSTOMER_SIGNATURE_AREA.lineX, y: sigY },
    end: { x: CUSTOMER_SIGNATURE_AREA.lineX + CUSTOMER_SIGNATURE_AREA.lineWidth, y: sigY },
    thickness: 1, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Customer Signature & Date', { x: CUSTOMER_SIGNATURE_AREA.lineX, y: sigY - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const dealerX = CUSTOMER_SIGNATURE_AREA.lineX + CUSTOMER_SIGNATURE_AREA.lineWidth + 60;
  page.drawLine({ start: { x: dealerX, y: sigY }, end: { x: dealerX + CUSTOMER_SIGNATURE_AREA.lineWidth, y: sigY }, thickness: 1, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('Authorized Signature / Dealer Stamp', { x: dealerX, y: sigY - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  return doc.save();
}

// web-only: stamps a customer-drawn signature (a PNG data URL from the
// public quotation signing page's canvas) onto the base quotation PDF,
// aligned to CUSTOMER_SIGNATURE_AREA. Not needed by admin, which only ever
// attaches the unsigned base PDF to the "Regenerate & Send" email.
export async function stampSignatureOnQuotationPdf(pdfBytes: Uint8Array, signaturePngDataUrl: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);

  const base64 = signaturePngDataUrl.split(',')[1] || '';
  const pngBytes = Buffer.from(base64, 'base64');
  const image = await doc.embedPng(pngBytes);

  const targetWidth = CUSTOMER_SIGNATURE_AREA.lineWidth;
  const scale = targetWidth / image.width;
  const targetHeight = Math.min(image.height * scale, CUSTOMER_SIGNATURE_AREA.maxImageHeight);

  page.drawImage(image, {
    x: CUSTOMER_SIGNATURE_AREA.lineX,
    y: CUSTOMER_SIGNATURE_AREA.lineY + 4,
    width: targetWidth,
    height: targetHeight,
  });

  return doc.save();
}
