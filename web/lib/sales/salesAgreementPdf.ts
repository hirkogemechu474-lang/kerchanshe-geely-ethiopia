import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { SalesOrder } from '@prisma/client';

// Real PDF sales agreement — replaces the earlier print-ready-HTML version
// (salesAgreementHtml.ts) per direct follow-up request. pdf-lib is pure
// JS/TS with no native binary or headless-browser dependency, so it works
// in this environment without adding infrastructure.
//
// Layout constants are exported so the signature-stamping step (web-only —
// see web/lib/sales/salesAgreementPdf.ts) knows exactly where to place a
// drawn signature image without re-deriving the layout. Keep this file and
// its web/ mirror byte-identical, same convention as pdiChecklistTemplate.ts.
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export const SIGNATURE_AREA = {
  customerLineX: MARGIN,
  customerLineY: 190,
  lineWidth: 220,
  maxImageHeight: 50,
  get agentLineX() {
    return this.customerLineX + this.lineWidth + 60;
  },
};

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

export async function buildSalesAgreementPdf(order: SalesOrder): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  page.drawText('Vehicle Purchase Agreement', { x: MARGIN, y, size: 20, font: bold });
  y -= 22;
  page.drawText(`Order ${order.orderNo} — Geely Ethiopia · Kerchanshe Auto`, {
    x: MARGIN, y, size: 10, font, color: rgb(0.4, 0.4, 0.4),
  });
  y -= 34;

  const section = (title: string) => {
    page.drawText(title, { x: MARGIN, y, size: 13, font: bold });
    y -= 6;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    y -= 16;
  };

  const row = (label: string, value: string) => {
    page.drawText(label, { x: MARGIN, y, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText(value, { x: MARGIN + 140, y, size: 10, font });
    y -= 18;
  };

  section('Customer');
  row('Name', order.customerName);
  row('Phone', order.customerPhone);
  if (order.customerEmail) row('Email', order.customerEmail);
  y -= 10;

  section('Vehicle');
  row('Model', order.vehicleModel);
  const config = (order.configurationJson || {}) as Record<string, unknown>;
  ([['trim', 'Trim'], ['color', 'Color'], ['wheels', 'Wheels'], ['interior', 'Interior']] as const).forEach(([key, label]) => {
    const value = config[key];
    if (typeof value === 'string' && value) row(label, value);
  });
  if (Array.isArray(config.accessories) && config.accessories.length > 0) {
    row('Accessories', (config.accessories as string[]).join(', '));
  }
  row('Total Price', order.totalPrice != null ? `ETB ${order.totalPrice.toLocaleString('en-US')}` : 'To be confirmed');
  row('Financing', order.financingStatus.replace(/_/g, ' '));
  y -= 10;

  section('Terms');
  const terms = [
    "This agreement confirms the customer's order for the vehicle described above. The total price is subject to final confirmation by Geely Ethiopia's sales department and any applicable financing approval. The vehicle will be prepared for delivery following a Pre-Delivery Inspection (PDI); delivery is contingent on the signed copy of this agreement being returned to Geely Ethiopia.",
    'By signing below, the customer confirms the accuracy of the details above and their intent to purchase the described vehicle on these terms.',
  ];
  for (const paragraph of terms) {
    for (const line of wrapText(paragraph, font, 9, CONTENT_WIDTH)) {
      page.drawText(line, { x: MARGIN, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 13;
    }
    y -= 6;
  }

  const sigY = SIGNATURE_AREA.customerLineY;
  page.drawLine({
    start: { x: SIGNATURE_AREA.customerLineX, y: sigY },
    end: { x: SIGNATURE_AREA.customerLineX + SIGNATURE_AREA.lineWidth, y: sigY },
    thickness: 1, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Customer Signature & Date', { x: SIGNATURE_AREA.customerLineX, y: sigY - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const agentX = SIGNATURE_AREA.agentLineX;
  page.drawLine({
    start: { x: agentX, y: sigY },
    end: { x: agentX + SIGNATURE_AREA.lineWidth, y: sigY },
    thickness: 1, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Sales Agent Signature & Date', { x: agentX, y: sigY - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const footer = `Approved ${order.approvedAt ? new Date(order.approvedAt).toLocaleString() : ''} · Order created ${new Date(order.orderDate).toLocaleDateString()}`;
  page.drawText(footer, { x: MARGIN, y: 40, size: 8, font, color: rgb(0.55, 0.55, 0.55) });

  return doc.save();
}

// web-only: stamps a customer-drawn signature (a PNG data URL from the
// public signing page's canvas) onto the base agreement PDF, aligned to
// the same SIGNATURE_AREA coordinates used to draw the signature line
// above. Not needed by admin, which only ever attaches the unsigned base
// PDF to the approval email.
export async function stampSignatureOnPdf(pdfBytes: Uint8Array, signaturePngDataUrl: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);

  const base64 = signaturePngDataUrl.split(',')[1] || '';
  const pngBytes = Buffer.from(base64, 'base64');
  const image = await doc.embedPng(pngBytes);

  const targetWidth = SIGNATURE_AREA.lineWidth;
  const scale = targetWidth / image.width;
  const targetHeight = Math.min(image.height * scale, SIGNATURE_AREA.maxImageHeight);

  page.drawImage(image, {
    x: SIGNATURE_AREA.customerLineX,
    y: SIGNATURE_AREA.customerLineY + 4,
    width: targetWidth,
    height: targetHeight,
  });

  return doc.save();
}

// web-only: stamps the countersigning manager's name + date as plain text
// onto the "Sales Agent Signature & Date" line — called once
// admin/app/api/admin/orders/[id]/countersign records countersignedAt, so
// the already-saved customer-signed PDF stops showing that line blank.
// Text, not a drawn image, matching the countersign's own identity+
// timestamp-only convention (no signature capture UI exists for staff).
export async function stampAgentSignatureText(pdfBytes: Uint8Array, agentName: string, date: Date): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText(agentName, {
    x: SIGNATURE_AREA.agentLineX,
    y: SIGNATURE_AREA.customerLineY + 22,
    size: 11,
    font,
  });
  page.drawText(date.toLocaleDateString(), {
    x: SIGNATURE_AREA.agentLineX,
    y: SIGNATURE_AREA.customerLineY + 4,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return doc.save();
}

// web-only: stamps the countersigning manager's own on-file signature
// image (see User.signatureUrl, set once via
// web/app/staff-signature/[token]) onto the "Sales Agent Signature &
// Date" line, plus the date as text below it — same mechanism as
// stampSignatureOnPdf's customer-signature embedding, just at the agent
// line, and used instead of stampAgentSignatureText whenever the
// countersigning person has a signature on file.
export async function stampAgentSignatureImage(pdfBytes: Uint8Array, signatureImageBytes: Uint8Array, date: Date): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const isPng = signatureImageBytes[0] === 0x89 && signatureImageBytes[1] === 0x50;
  const image = isPng ? await doc.embedPng(signatureImageBytes) : await doc.embedJpg(signatureImageBytes);

  const targetWidth = SIGNATURE_AREA.lineWidth;
  const scale = targetWidth / image.width;
  const targetHeight = Math.min(image.height * scale, SIGNATURE_AREA.maxImageHeight);

  page.drawImage(image, {
    x: SIGNATURE_AREA.agentLineX,
    y: SIGNATURE_AREA.customerLineY + 4,
    width: targetWidth,
    height: targetHeight,
  });
  page.drawText(date.toLocaleDateString(), {
    x: SIGNATURE_AREA.agentLineX + targetWidth + 8,
    y: SIGNATURE_AREA.customerLineY + 8,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return doc.save();
}
