import { PDFDocument, PDFFont, PDFPage, PDFImage, StandardFonts, rgb, RGB } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { formatCurrency, formatDate } from '../../utils/formatting';
import type { CompanyInfo } from './companyInfo';

export const PDF_MARGIN = 54;
export const PDF_CONTENT_WIDTH = 612 - PDF_MARGIN * 2;

export const COLORS = {
  brand: rgb(0 / 255, 0 / 255, 0 / 255),
  brandRed: rgb(214 / 255, 27 / 255, 40 / 255),
  dark: rgb(33 / 255, 37 / 255, 41 / 255),
  gray: rgb(120 / 255, 124 / 255, 130 / 255),
  lightGray: rgb(240 / 255, 242 / 255, 245 / 255),
  border: rgb(222 / 255, 226 / 255, 231 / 255),
  white: rgb(1, 1, 1),
};

export interface PagedContext {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  y: number;
}

export interface NewDocResult {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

export async function openDocument(): Promise<NewDocResult> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  return { doc, font, bold, italic };
}

export function addPage(ctx: NewDocResult): PagedContext {
  const page = ctx.doc.addPage([612, 792]);
  return { ...ctx, page, y: 792 - PDF_MARGIN };
}

// Y position where body content should start on a page that has a
// drawHeaderFooter() title/company-name header — sits safely below the
// header's divider line (drawn at 792-74) regardless of how long the
// company legal name is. Set `ctx.y = PDF_HEADER_CONTENT_Y` after calling
// drawHeaderFooter(), instead of nudging the addPage() default.
export const PDF_HEADER_CONTENT_Y = 792 - 74 - 20;

export function ensureSpace(ctx: PagedContext, needed: number): PagedContext {
  if (ctx.y - needed < 60) {
    return addPage(ctx);
  }
  return ctx;
}

export function drawHeaderFooter(ctx: PagedContext, title: string | undefined, company: CompanyInfo) {
  const { page } = ctx;
  const width = page.getWidth();
  const top = 792;
  const centerX = width / 2;

  // Centered two-line title block — company legal name, then the document
  // title below it — matching the drafts' letterhead ("KERCHANSHE TRADING
  // PLC" / "GEELY ELECTRIC VEHICLE SALES QUOTATION" etc.) instead of a
  // left-aligned wordmark + right-aligned title.
  const nameSize = 14;
  const nameText = company.legalName.toUpperCase();
  const nameWidth = ctx.bold.widthOfTextAtSize(nameText, nameSize);
  page.drawText(nameText, { x: centerX - nameWidth / 2, y: top - 38, size: nameSize, font: ctx.bold, color: COLORS.dark });

  if (title) {
    const titleSize = 11;
    const titleWidth = ctx.bold.widthOfTextAtSize(title, titleSize);
    page.drawText(title, { x: centerX - titleWidth / 2, y: top - 56, size: titleSize, font: ctx.bold, color: COLORS.dark });
  }

  page.drawLine({
    start: { x: PDF_MARGIN, y: top - 74 },
    end: { x: width - PDF_MARGIN, y: top - 74 },
    thickness: 1,
    color: COLORS.border,
  });

  page.drawLine({
    start: { x: PDF_MARGIN, y: 30 },
    end: { x: width - PDF_MARGIN, y: 30 },
    thickness: 1,
    color: COLORS.border,
  });
  const footerParts = [
    company.legalName,
    'GEELY Vehicles',
    'Ethiopia',
    company.tin ? `TIN: ${company.tin}` : null,
    company.phone ? `Tel: ${company.phone}` : null,
    company.email ? `Email: ${company.email}` : null,
  ].filter(Boolean);
  page.drawText(footerParts.join(' | '), { x: PDF_MARGIN, y: 20, size: 7, font: ctx.font, color: COLORS.gray });
}

export function drawRightText(ctx: PagedContext, text: string, x: number, y: number, size: number, font: PDFFont, color: RGB = COLORS.dark) {
  const width = ctx.font.widthOfTextAtSize(text, size);
  ctx.page.drawText(text, { x: x - width, y, size, font, color });
  return width;
}

export function drawLabelValue(ctx: PagedContext, label: string, value: string, x: number, y: number) {
  const safeLabel = sanitizePdfText(label);
  const safeValue = sanitizePdfText(value);
  ctx.page.drawText(safeLabel, { x, y, size: 8, font: ctx.font, color: COLORS.gray });
  ctx.page.drawText(safeValue, { x, y: y - 13, size: 11, font: ctx.bold, color: COLORS.dark });
}

export function drawSectionTitle(ctx: PagedContext, text: string) {
  ctx.page.drawText(text.toUpperCase(), { x: PDF_MARGIN, y: ctx.y, size: 10, font: ctx.bold, color: COLORS.dark });
  ctx.page.drawLine({
    start: { x: PDF_MARGIN, y: ctx.y - 6 },
    end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: ctx.y - 6 },
    thickness: 1,
    color: COLORS.border,
  });
  ctx.y -= 20;
}

// Shortens text with an ellipsis so it fits maxWidth at the given size —
// drawTable() cells are single-line/fixed-height, so a value wider than its
// column would otherwise overpaint the next column instead of wrapping.
function truncateToWidth(font: PDFFont, text: string, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  const ellipsis = '…';
  let result = text;
  while (result.length > 0 && font.widthOfTextAtSize(result + ellipsis, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result.length > 0 ? result + ellipsis : ellipsis;
}

export function drawTable(ctx: PagedContext, headers: string[], rows: Array<Array<string | number>>, colWidths: number[]) {
  const pad = 8;
  const rowH = 20;
  const cellX: number[] = [];
  let acc = PDF_MARGIN;
  for (const w of colWidths) {
    cellX.push(acc);
    acc += w;
  }

  let current = ensureSpace(ctx, rowH);
  const headerY = current.y - rowH + 4;
  current.page.drawRectangle({
    x: PDF_MARGIN,
    y: headerY,
    width: PDF_CONTENT_WIDTH,
    height: rowH,
    color: COLORS.lightGray,
  });
  headers.forEach((h, i) => {
    current.page.drawText(sanitizePdfText(h.toUpperCase()), { x: cellX[i] + pad, y: headerY + 4, size: 8, font: current.bold, color: COLORS.dark });
  });
  current.y = headerY + 4;

  for (const row of rows) {
    current = ensureSpace(current, rowH);
    const rowTop = current.y;
    current.page.drawLine({
      start: { x: PDF_MARGIN, y: rowTop },
      end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: rowTop },
      thickness: 0.5,
      color: COLORS.border,
    });
    row.forEach((val, i) => {
      const font = i === 0 ? current.bold : current.font;
      const maxWidth = colWidths[i] - pad * 2;
      const text = truncateToWidth(font, sanitizePdfText(String(val)), 10, maxWidth);
      const isAmount = colWidths[i] === 80;
      const x = isAmount ? cellX[i] + colWidths[i] - pad - font.widthOfTextAtSize(text, 10) : cellX[i] + pad;
      current.page.drawText(text, { x, y: rowTop - 15, size: 10, font, color: COLORS.dark });
    });
    current.y = rowTop - rowH;
  }
  current.page.drawLine({
    start: { x: PDF_MARGIN, y: current.y + 4 },
    end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: current.y + 4 },
    thickness: 0.5,
    color: COLORS.border,
  });
}

// Small tick-box glyph used by every checklist table across the 4 sales
// documents (What's Included, Items Handed Over, Vehicle Inspection,
// EV Guidance, Recommended Attachments). Draws a bordered square, filled
// dark when checked, with an optional label to its right.
export function drawCheckbox(ctx: PagedContext, x: number, y: number, checked: boolean, label?: string, size = 9) {
  ctx.page.drawRectangle({
    x, y, width: size, height: size,
    borderColor: COLORS.dark, borderWidth: 1,
    color: checked ? COLORS.dark : COLORS.white,
  });
  if (checked) {
    ctx.page.drawText('X', { x: x + size * 0.18, y: y + size * 0.18, size: size * 0.85, font: ctx.bold, color: COLORS.white });
  }
  if (label) {
    ctx.page.drawText(label, { x: x + size + 6, y: y + size * 0.15, size: 9, font: ctx.font, color: COLORS.dark });
  }
}

export interface SignatureEntry {
  heading?: string; // e.g. "FOR KERCHANSHE TRADING PLC"
  name?: string | null;
  title?: string | null;
  date?: string | null;
  showStamp?: boolean;
  signatureImage?: PDFImage | null;
}

export async function embedSignatureImage(doc: PDFDocument, source?: string | null): Promise<PDFImage | null> {
  if (!source) return null;
  try {
    let bytes: Buffer;
    if (source.startsWith('data:image/')) {
      bytes = Buffer.from(source.split(',')[1] || '', 'base64');
    } else {
      const relative = source.startsWith('/') ? source.slice(1) : source;
      // Uploaded files are meant to live under apps/admin/public (see
      // upload.routes.ts's ADMIN_PUBLIC_UPLOADS), but some were historically
      // written under apps/web/public instead (an older/inconsistent upload
      // path) — check both so a signature already on disk doesn't silently
      // fail to embed just because of which app it happened to land under.
      const candidatePaths = [
        path.resolve(process.cwd(), '..', 'apps', 'admin', 'public', relative),
        path.resolve(process.cwd(), '..', 'apps', 'web', 'public', relative),
      ];
      const localPath = candidatePaths.find((p) => fs.existsSync(p));
      if (localPath) {
        bytes = fs.readFileSync(localPath);
      } else if (/^https?:\/\//i.test(source)) {
        const response = await fetch(source);
        if (!response.ok) return null;
        bytes = Buffer.from(await response.arrayBuffer());
      } else {
        return null;
      }
    }
    if (!bytes.length) return null;
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return doc.embedPng(bytes);
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return doc.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
}

// Two-column Name/Title/Signature-line/Date(/Stamp) block, used by every
// document's closing acknowledgement/signature section. Replaces the
// hand-duplicated blank-line pairs previously copy-pasted into
// salesAgreement.pdf.ts and handover.pdf.ts.
export function drawSignatureBlock(ctx: PagedContext, left: SignatureEntry, right: SignatureEntry) {
  const colWidth = PDF_CONTENT_WIDTH / 2 - 16;
  const startY = ctx.y;
  const columns: Array<[SignatureEntry, number]> = [[left, PDF_MARGIN], [right, PDF_MARGIN + PDF_CONTENT_WIDTH / 2 + 16]];
  let endY = startY;

  for (const [entry, x] of columns) {
    let ey = startY;
    if (entry.heading) {
      ctx.page.drawText(sanitizePdfText(entry.heading), { x, y: ey, size: 9, font: ctx.bold, color: COLORS.dark });
      ey -= 18;
    }
    ctx.page.drawText('Name:', { x, y: ey, size: 9, font: ctx.font, color: COLORS.gray });
    ctx.page.drawText(sanitizePdfText(entry.name || '____________________________'), { x: x + 40, y: ey, size: 10, font: ctx.font, color: COLORS.dark });
    ey -= 16;
    ctx.page.drawText('Title:', { x, y: ey, size: 9, font: ctx.font, color: COLORS.gray });
    ctx.page.drawText(sanitizePdfText(entry.title || '____________________________'), { x: x + 40, y: ey, size: 10, font: ctx.font, color: COLORS.dark });
    ey -= 16;
    ctx.page.drawText('Signature:', { x, y: ey, size: 9, font: ctx.font, color: COLORS.gray });
    if (entry.signatureImage) {
      const scaled = entry.signatureImage.scaleToFit(colWidth - 70, 24);
      ctx.page.drawImage(entry.signatureImage, { x: x + 64, y: ey - 10, width: scaled.width, height: scaled.height });
    }
    ctx.page.drawLine({ start: { x: x + 62, y: ey - 2 }, end: { x: x + colWidth, y: ey - 2 }, thickness: 0.5, color: COLORS.border });
    ey -= 16;
    ctx.page.drawText('Date:', { x, y: ey, size: 9, font: ctx.font, color: COLORS.gray });
    ctx.page.drawText(sanitizePdfText(entry.date || '____________________________'), { x: x + 40, y: ey, size: 10, font: ctx.font, color: COLORS.dark });
    ey -= 16;
    if (entry.showStamp) {
      ctx.page.drawText('Stamp:', { x, y: ey, size: 9, font: ctx.font, color: COLORS.gray });
      ey -= 16;
    }
    endY = Math.min(endY, ey);
  }
  ctx.y = endY - 6;
}

// Bordered "Item | Details" two-column field table — the draft documents'
// most common table shape (Vehicle Details, Vehicle and Sales Details,
// Price tables, etc.), distinct from drawTable() above (which is headered
// and column-numeric, for line items). Values wrap onto extra lines when
// they don't fit in one row.
export function drawFieldTable(ctx: PagedContext, rows: Array<[string, string]>, labelWidth = 180) {
  const pad = 8;
  const valueX = PDF_MARGIN + labelWidth + pad;
  const valueWidth = PDF_CONTENT_WIDTH - labelWidth - pad * 2;

  for (const [label, value] of rows) {
    const safeValue = sanitizePdfText(value);
    const lines = Math.max(1, Math.ceil(ctx.font.widthOfTextAtSize(safeValue, 10) / valueWidth));
    const rowH = 14 * lines + 10;
    ctx = ensureSpace(ctx, rowH);
    const rowTop = ctx.y;
    ctx.page.drawLine({ start: { x: PDF_MARGIN, y: rowTop }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: rowTop }, thickness: 0.5, color: COLORS.border });
    ctx.page.drawText(label, { x: PDF_MARGIN + pad, y: rowTop - 15, size: 9, font: ctx.bold, color: COLORS.dark });
    const wrapped = wrapText({ ...ctx, y: rowTop - 15 }, safeValue, valueX, rowTop - 15, 10, valueWidth);
    void wrapped;
    ctx.y = rowTop - rowH;
  }
  ctx.page.drawLine({ start: { x: PDF_MARGIN, y: ctx.y + 4 }, end: { x: PDF_MARGIN + PDF_CONTENT_WIDTH, y: ctx.y + 4 }, thickness: 0.5, color: COLORS.border });
  return ctx;
}

function sanitizePdfText(text: string): string {
  return text.replace(/[\r\n\t]+/g, ' ');
}

export function wrapText(ctx: PagedContext, text: string, x: number, y: number, size: number, maxWidth: number): PagedContext {
  const words = sanitizePdfText(text).split(/\s+/);
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.font.widthOfTextAtSize(test, size) > maxWidth && line) {
      ctx.page.drawText(line, { x, y, size, font: ctx.font, color: COLORS.dark });
      y -= 15;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.page.drawText(line, { x, y, size, font: ctx.font, color: COLORS.dark });
  }
  return { ...ctx, y };
}

export function isCurrency(value: TValue): boolean {
  return typeof value === 'number';
}
export type TValue = string | number | null | undefined;

// "Brand / Model" rows across all 4 documents print a "GEELY" prefix
// (matching the draft forms). vehicleModel is sometimes stored already
// including the brand (e.g. "Geely EX5", matching Vehicle.name's catalog
// convention) and sometimes just the model — strip a leading Geely so it's
// never doubled either way.
export function formatBrandModel(vehicleModel: string | null | undefined): string {
  const model = (vehicleModel || '—').replace(/^geely\s+/i, '');
  return `GEELY ${model}`;
}

export function fillValue(value: TValue, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return formatCurrency(value);
  return String(value);
}

export function dateValue(value: any): string {
  if (!value) return '—';
  return formatDate(new Date(value));
}

export { formatCurrency, formatDate };

export async function saveBuffer(ctx: NewDocResult): Promise<Buffer> {
  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}
