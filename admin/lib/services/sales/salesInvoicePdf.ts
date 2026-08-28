import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { SalesOrder } from '@prisma/client';
import { companyConfig, contactConfig } from '../../env';

// Sales invoice PDF — mirrors salesAgreementPdf.ts's layout conventions
// (pdf-lib, no native/browser dependency) but deliberately simpler: no
// signature area, since an invoice doesn't need signing. Admin-only; no
// public customer-facing view exists for it (unlike the agreement), so
// there's no web/ copy of this module.
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;

function readLogoBytes(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'logos', 'geely-logo.png'));
  } catch {
    return null;
  }
}

export async function buildSalesInvoicePdf(order: SalesOrder): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  // Dealer letterhead — same treatment as every other customer-facing
  // document (salesQuotationPdf.ts, salesAgreementPdf.ts, handoverPdf.ts).
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

  page.drawText('Sales Invoice', { x: MARGIN, y, size: 18, font: bold });
  y -= 30;

  const row = (label: string, value: string) => {
    page.drawText(label, { x: MARGIN, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(value, { x: MARGIN + 160, y, size: 10, font });
    y -= 20;
  };

  row('Invoice No.', order.invoiceNo || '—');
  row('Invoice Date', order.invoicedAt ? new Date(order.invoicedAt).toLocaleDateString() : '—');
  row('Order No.', order.orderNo);
  y -= 14;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 24;

  row('Bill To', order.customerName);
  row('Phone', order.customerPhone);
  if (order.customerEmail) row('Email', order.customerEmail);
  y -= 14;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 24;

  row('Vehicle', order.vehicleModel);
  row('Registration No.', order.registrationNumber || 'Not yet registered');
  y -= 14;

  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 30;

  page.drawText('Amount Due', { x: MARGIN, y, size: 13, font: bold });
  const amountText = order.invoiceAmount != null
    ? `ETB ${order.invoiceAmount.toLocaleString('en-US')}`
    : 'To be confirmed';
  const amountWidth = bold.widthOfTextAtSize(amountText, 13);
  page.drawText(amountText, { x: PAGE_WIDTH - MARGIN - amountWidth, y, size: 13, font: bold });
  y -= 40;

  page.drawText('Payment is processed through the customer\'s selected bank; this invoice records', {
    x: MARGIN, y, size: 9, font, color: rgb(0.45, 0.45, 0.45),
  });
  y -= 13;
  page.drawText('the final amount due for the vehicle described above.', {
    x: MARGIN, y, size: 9, font, color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
}
