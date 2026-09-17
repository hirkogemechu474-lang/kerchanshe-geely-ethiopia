import {
  openDocument, saveBuffer, addPage, drawHeaderFooter, drawSectionTitle, drawFieldTable,
  ensureSpace, wrapText, PDF_MARGIN, PDF_CONTENT_WIDTH, PDF_HEADER_CONTENT_Y, dateValue, fillValue,
  drawCheckbox,
} from './pdfLayout';
import type { CompanyInfo } from './companyInfo';
import { prisma } from '../../config/database';

export interface WarrantyCertificatePdfData {
  orderNo: string;
  customerName: string;
  customerPhone?: string | null;
  vehicleModel: string;
  vin?: string | null;
  purchaseDate: Date | string;
  warrantyStartDate: Date | string;
  warrantyEndDate: Date | string;
  warrantyYears: number;
  warrantyKm: number;
  nextServiceDate?: Date | string | null;
  nextServiceKm?: number | null;
}

interface WarrantyPageSettings {
  hero?: { eyebrow?: string; title?: string; subtitle?: string };
  whatsCovered?: Array<{ title: string; description: string }>;
  whatsNotCovered?: Array<{ title: string; description: string }>;
  cta?: { title?: string; description?: string };
  documents?: Array<{ title: string; description: string; url: string }>;
}

async function getWarrantyPageSettings(): Promise<WarrantyPageSettings> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'warranty_page' } });
    if (!setting?.value) return {};
    return JSON.parse(setting.value);
  } catch {
    return {};
  }
}

const DEFAULT_TERMS = [
  'This warranty covers manufacturing defects in materials and workmanship under normal use, subject to the manufacturer\'s warranty policy.',
  'Coverage ends at whichever comes first: the warranty end date above, or the vehicle reaching the maximum warranty distance.',
  'Regular scheduled maintenance at an authorized service center is required to keep this warranty valid.',
  'Damage from accidents, misuse, unauthorized modification, or normal wear items is not covered.',
  'Present this certificate (or the order/reference number above) when booking service or filing a warranty claim.',
];

export async function generateWarrantyCertificatePdf(data: WarrantyCertificatePdfData, company: CompanyInfo): Promise<Buffer> {
  const settings = await getWarrantyPageSettings();
  const covered = settings.whatsCovered ?? [];
  const notCovered = settings.whatsNotCovered ?? [];

  const doc = await openDocument();
  let ctx = addPage(doc);
  ctx = await drawHeaderFooter(ctx, 'VEHICLE WARRANTY CERTIFICATE', company);

  ctx.y = PDF_HEADER_CONTENT_Y;

  // ── Customer & Vehicle ──
  drawSectionTitle(ctx, 'Customer & Vehicle');
  ctx = drawFieldTable(ctx, [
    ['Order No.', fillValue(data.orderNo)],
    ['Customer Name', fillValue(data.customerName)],
    ['Phone', fillValue(data.customerPhone)],
    ['Vehicle Model', fillValue(data.vehicleModel)],
    ['VIN / Chassis No.', fillValue(data.vin)],
    ['Purchase Date', dateValue(data.purchaseDate)],
  ]);

  // ── Warranty Coverage ──
  ctx.y -= 16;
  drawSectionTitle(ctx, 'Warranty Coverage');
  ctx = drawFieldTable(ctx, [
    ['Warranty Start', dateValue(data.warrantyStartDate)],
    ['Warranty End', dateValue(data.warrantyEndDate)],
    ['Coverage Period', `${data.warrantyYears} years`],
    ['Coverage Distance', `${data.warrantyKm.toLocaleString()} km`],
    ['Next Scheduled Service', data.nextServiceDate ? dateValue(data.nextServiceDate) : '—'],
    ['Next Service Due At', data.nextServiceKm != null ? `${data.nextServiceKm.toLocaleString()} km` : '—'],
  ]);

  // ── What's Covered (from warranty page settings) ──
  if (covered.length > 0) {
    ctx.y -= 20;
    drawSectionTitle(ctx, "What's Covered");
    for (const item of covered) {
      ctx = ensureSpace(ctx, 28);
      drawCheckbox(ctx, PDF_MARGIN, ctx.y - 2, true);
      ctx = wrapText(ctx, `${item.title} — ${item.description}`, PDF_MARGIN + 18, ctx.y, 9, PDF_CONTENT_WIDTH - 18);
      ctx.y -= 10;
    }
  }

  // ── What's Not Covered (from warranty page settings) ──
  if (notCovered.length > 0) {
    ctx.y -= 20;
    drawSectionTitle(ctx, "What's Not Covered");
    for (const item of notCovered) {
      ctx = ensureSpace(ctx, 28);
      drawCheckbox(ctx, PDF_MARGIN, ctx.y - 2, false);
      ctx = wrapText(ctx, `${item.title} — ${item.description}`, PDF_MARGIN + 18, ctx.y, 9, PDF_CONTENT_WIDTH - 18);
      ctx.y -= 10;
    }
  }

  // ── Terms & Conditions ──
  ctx.y -= 20;
  drawSectionTitle(ctx, 'Terms & Conditions');
  const terms = DEFAULT_TERMS;
  terms.forEach((term, i) => {
    ctx = ensureSpace(ctx, 32);
    ctx = wrapText(ctx, `${i + 1}. ${term}`, PDF_MARGIN, ctx.y, 8.5, PDF_CONTENT_WIDTH);
    ctx.y -= 10;
  });

  // ── Referenced Documents ──
  const docs = settings.documents ?? [];
  if (docs.length > 0) {
    ctx.y -= 20;
    drawSectionTitle(ctx, 'Referenced Documents');
    for (const doc of docs) {
      ctx = ensureSpace(ctx, 20);
      ctx = wrapText(ctx, `• ${doc.title}${doc.description ? ` — ${doc.description}` : ''}`, PDF_MARGIN, ctx.y, 9, PDF_CONTENT_WIDTH);
      ctx.y -= 6;
    }
  }

  return saveBuffer(doc);
}
