import { PDFDocument } from 'pdf-lib';
import { openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawTable, wrapText, PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, COLORS } from './pdfLayout';
import type { CompanyInfo } from './companyInfo';

export interface BrochurePdfData {
  vehicleName: string;
  model: string;
  specifications: Record<string, string>;
  images: string[];
}

export async function generateBrochurePdf(data: BrochurePdfData, company: CompanyInfo): Promise<Buffer> {
  const doc = await openDocument();
  let ctx = addPage(doc);

  // Cover hero band
  ctx.page.drawRectangle({
    x: PDF_MARGIN, y: 500, width: PDF_CONTENT_WIDTH, height: 180, color: COLORS.dark,
  });
  ctx.page.drawText(data.vehicleName.toUpperCase(), {
    x: PDF_MARGIN, y: 630, size: 28, font: doc.bold, color: COLORS.white,
  });
  ctx.page.drawText(data.model || 'Geely Automobile', {
    x: PDF_MARGIN, y: 592, size: 13, font: doc.font, color: COLORS.lightGray,
  });
  ctx.page.drawText(`${company.legalName.toUpperCase()} · GEELY ETHIOPIA`, {
    x: PDF_MARGIN, y: 520, size: 9, font: doc.font, color: COLORS.lightGray,
  });

  // Try to embed first image as a visual accent if it's inline base64
  if (data.images && data.images.length > 0) {
    const imgCtx = await tryEmbedImage(doc, data.images[0]);
    if (imgCtx) {
      const h = 130;
      const width = Math.min(PDF_CONTENT_WIDTH * 0.9, h * (imgCtx.width / imgCtx.height));
      const x = (612 - width) / 2;
      ctx.page.drawRectangle({ x: x - 4, y: 300 - 4, width: width + 8, height: h + 8, color: COLORS.lightGray });
      ctx.page.drawImage(imgCtx, { x, y: 300, width, height: h });
      ctx.y = 280;
    } else {
      ctx.y = 480;
    }
  } else {
    ctx.y = 480;
  }

  const specEntries = Object.entries(data.specifications || {});
  if (specEntries.length > 0) {
    ctx.y -= 10;
    drawSectionTitle(ctx, 'Key Specifications');
    const rows: Array<Array<string | number>> = [];
    for (let i = 0; i < specEntries.length; i += 2) {
      const a = specEntries[i];
      const b = specEntries[i + 1];
      rows.push([`${a ? a[0] + ': ' + (a[1] || '—') : ''}`, `${b ? b[0] + ': ' + (b[1] || '—') : ''}`]);
    }
    const colW = PDF_CONTENT_WIDTH / 2;
    drawTable(ctx, ['Specification', 'Specification'], rows, [colW, colW]);
  }

  // Highlights page
  ctx = addPage(doc);
  ctx = await drawHeaderFooter(ctx, 'FEATURES & OVERVIEW', company);
  ctx.y = PDF_HEADER_CONTENT_Y;
  drawSectionTitle(ctx, 'Highlights');
  const highlights = [
    `${data.vehicleName} — a premium Geely model available exclusively through ${company.legalName}.`,
    'Engineered for the Ethiopian market with robust performance, modern safety systems and a comprehensive manufacturer warranty.',
    'Configuration options include a range of exterior colours, interior packages, alloy wheels and accessories. ' +
      `Contact ${company.legalName} for pricing, test drives and nationwide delivery.`,
  ];
  for (const para of highlights) {
    ctx.y -= 4;
    ctx = wrapText(ctx, para, PDF_MARGIN, ctx.y - 2, 11, PDF_CONTENT_WIDTH);
    ctx.y -= 8;
  }

  return saveBuffer(doc);
}

async function tryEmbedImage(doc: { doc: PDFDocument }, urlOrData: string) {
  try {
    if (/^https?:\/\//.test(urlOrData) || urlOrData.startsWith('/')) {
      return null;
    }
    if (urlOrData.startsWith('data:image/png')) {
      const raw = Buffer.from(urlOrData.split(',')[1], 'base64');
      return raw.length ? doc.doc.embedPng(raw) : null;
    }
    if (urlOrData.startsWith('data:image/jpeg') || urlOrData.startsWith('data:image/jpg')) {
      const raw = Buffer.from(urlOrData.split(',')[1], 'base64');
      return raw.length ? doc.doc.embedJpg(raw) : null;
    }
    return null;
  } catch {
    return null;
  }
}
