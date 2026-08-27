import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
import type { SalesOrder } from '@prisma/client';

// Vehicle handover confirmation — the customer's own acknowledgement of
// receiving the vehicle, distinct from the earlier sales agreement (see
// salesAgreementPdf.ts, which this deliberately mirrors layout-for-layout
// so the two documents feel like one continuous paper trail). Signed by the
// customer at web/app/handover/[orderId], then countersigned by a manager
// (admin/app/api/admin/orders/[id]/handover-countersign) — same two-step
// pattern as the agreement's sign/countersign. Keep this file and its
// admin/ mirror byte-identical, same convention as salesAgreementPdf.ts.
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export const HANDOVER_SIGNATURE_AREA = {
  customerLineX: MARGIN,
  customerLineY: 220,
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

export async function buildHandoverPdf(order: SalesOrder): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  page.drawText('Vehicle Handover Confirmation', { x: MARGIN, y, size: 20, font: bold });
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
  row('Order Total', order.totalPrice != null ? `ETB ${order.totalPrice.toLocaleString('en-US')}` : 'To be confirmed');
  if (order.registrationNumber) row('Registration No.', order.registrationNumber);
  if (order.invoiceNo) row('Invoice No.', order.invoiceNo);
  y -= 10;

  section('Confirmation');
  const terms = [
    'By signing below, the customer confirms receipt of the vehicle described above, in good condition, together with all agreed documents (registration, invoice, and warranty booklet) and accessories.',
    'This handover confirmation is countersigned by a Geely Ethiopia representative to close out the order.',
  ];
  for (const paragraph of terms) {
    for (const line of wrapText(paragraph, font, 9, CONTENT_WIDTH)) {
      page.drawText(line, { x: MARGIN, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 13;
    }
    y -= 6;
  }

  const sigY = HANDOVER_SIGNATURE_AREA.customerLineY;
  page.drawLine({
    start: { x: HANDOVER_SIGNATURE_AREA.customerLineX, y: sigY },
    end: { x: HANDOVER_SIGNATURE_AREA.customerLineX + HANDOVER_SIGNATURE_AREA.lineWidth, y: sigY },
    thickness: 1, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Customer Signature & Date', { x: HANDOVER_SIGNATURE_AREA.customerLineX, y: sigY - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const agentX = HANDOVER_SIGNATURE_AREA.agentLineX;
  page.drawLine({
    start: { x: agentX, y: sigY },
    end: { x: agentX + HANDOVER_SIGNATURE_AREA.lineWidth, y: sigY },
    thickness: 1, color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Geely Ethiopia Representative & Date', { x: agentX, y: sigY - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  const footer = `Delivered ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''} · Order created ${new Date(order.orderDate).toLocaleDateString()}`;
  page.drawText(footer, { x: MARGIN, y: 40, size: 8, font, color: rgb(0.55, 0.55, 0.55) });

  return doc.save();
}

// web-only: stamps a customer-drawn signature (a PNG data URL from the
// public signing page's canvas) onto the base handover PDF — same
// mechanism as stampSignatureOnPdf in salesAgreementPdf.ts, just aligned to
// HANDOVER_SIGNATURE_AREA's coordinates instead.
export async function stampHandoverSignatureOnPdf(pdfBytes: Uint8Array, signaturePngDataUrl: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);

  const base64 = signaturePngDataUrl.split(',')[1] || '';
  const pngBytes = Buffer.from(base64, 'base64');
  const image = await doc.embedPng(pngBytes);

  const targetWidth = HANDOVER_SIGNATURE_AREA.lineWidth;
  const scale = targetWidth / image.width;
  const targetHeight = Math.min(image.height * scale, HANDOVER_SIGNATURE_AREA.maxImageHeight);

  page.drawImage(image, {
    x: HANDOVER_SIGNATURE_AREA.customerLineX,
    y: HANDOVER_SIGNATURE_AREA.customerLineY + 4,
    width: targetWidth,
    height: targetHeight,
  });

  return doc.save();
}

// web-only: stamps the countersigning manager's name + date as plain text
// onto the "Geely Ethiopia Representative & Date" line — called once
// admin/app/api/admin/orders/[id]/handover-countersign records
// handoverCountersignedAt, so the already-saved signed PDF stops showing
// that line blank. Text, not a drawn image — same convention as
// stampAgentSignatureText in salesAgreementPdf.ts.
export async function stampHandoverAgentSignatureText(pdfBytes: Uint8Array, agentName: string, date: Date): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText(agentName, {
    x: HANDOVER_SIGNATURE_AREA.agentLineX,
    y: HANDOVER_SIGNATURE_AREA.customerLineY + 22,
    size: 11,
    font,
  });
  page.drawText(date.toLocaleDateString(), {
    x: HANDOVER_SIGNATURE_AREA.agentLineX,
    y: HANDOVER_SIGNATURE_AREA.customerLineY + 4,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return doc.save();
}

// web-only: stamps the countersigning manager's own on-file signature
// image (see User.signatureUrl) onto the "Geely Ethiopia Representative &
// Date" line, plus the date as text — same mechanism as
// stampAgentSignatureImage in salesAgreementPdf.ts, used instead of
// stampHandoverAgentSignatureText whenever the countersigning person has
// a signature on file.
export async function stampHandoverAgentSignatureImage(pdfBytes: Uint8Array, signatureImageBytes: Uint8Array, date: Date): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const page = doc.getPage(0);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const isPng = signatureImageBytes[0] === 0x89 && signatureImageBytes[1] === 0x50;
  const image = isPng ? await doc.embedPng(signatureImageBytes) : await doc.embedJpg(signatureImageBytes);

  const targetWidth = HANDOVER_SIGNATURE_AREA.lineWidth;
  const scale = targetWidth / image.width;
  const targetHeight = Math.min(image.height * scale, HANDOVER_SIGNATURE_AREA.maxImageHeight);

  page.drawImage(image, {
    x: HANDOVER_SIGNATURE_AREA.agentLineX,
    y: HANDOVER_SIGNATURE_AREA.customerLineY + 4,
    width: targetWidth,
    height: targetHeight,
  });
  page.drawText(date.toLocaleDateString(), {
    x: HANDOVER_SIGNATURE_AREA.agentLineX + targetWidth + 8,
    y: HANDOVER_SIGNATURE_AREA.customerLineY + 8,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return doc.save();
}
