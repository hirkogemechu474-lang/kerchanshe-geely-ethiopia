import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { UPLOADS_ROOT } from '@/lib/upload-utils';
import { buildSalesQuotationPdf, stampSignatureOnQuotationPdf } from '@/lib/sales/salesQuotationPdf';

// Public — customer e-signs (or attaches a photo of a signed printout of)
// the Sales Quotation PDF, mirroring web/app/api/agreement/[orderId]/sign/route.ts's
// two-mode convention. One-way: an already-signed quotation 409s rather
// than overwriting. On success, status automatically moves to "accepted" —
// distinct from the older, manually-set "approved" — so staff can see at a
// glance that the customer digitally accepted this quotation.
export async function POST(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.quotationSign);
  if (rateLimitResult) return rateLimitResult;

  const { reference } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const quotation = await prisma.quotation.findUnique({ where: { reference } });
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }
  if (!quotation.quotationNo) {
    return NextResponse.json({ error: 'This quotation has not been generated yet.' }, { status: 409 });
  }
  if (quotation.signedDocumentUrl) {
    return NextResponse.json({ error: 'This quotation has already been signed.' }, { status: 409 });
  }

  let signedDocumentUrl: string;

  if (type === 'drawn') {
    const signatureDataUrl = typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return NextResponse.json({ error: 'A valid drawn signature is required.' }, { status: 400 });
    }
    const basePdf = await buildSalesQuotationPdf(quotation);
    const signedPdf = await stampSignatureOnQuotationPdf(basePdf, signatureDataUrl);

    const uploadDir = path.join(UPLOADS_ROOT, 'signed-quotations');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${quotation.quotationNo}-${Date.now()}.pdf`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(signedPdf));
    signedDocumentUrl = `/uploads/signed-quotations/${filename}`;
  } else {
    const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl.trim() : '';
    if (!photoUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'A valid uploaded photo is required.' }, { status: 400 });
    }
    signedDocumentUrl = photoUrl;
  }

  const updated = await prisma.quotation.update({
    where: { reference },
    data: { signedDocumentUrl, signedAt: new Date(), status: 'accepted' },
  });

  return NextResponse.json({ signedDocumentUrl: updated.signedDocumentUrl, signedAt: updated.signedAt, status: updated.status });
}
