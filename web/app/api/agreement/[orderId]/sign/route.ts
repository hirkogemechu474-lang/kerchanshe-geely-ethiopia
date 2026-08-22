import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { UPLOADS_ROOT } from '@/lib/upload-utils';
import { buildSalesAgreementPdf, stampSignatureOnPdf } from '@/lib/sales/salesAgreementPdf';

// Public — completes the self-service "e-sign or attach" step. Two ways
// in, both one-way (an already-signed order 409s rather than overwriting):
// - `type: 'drawn'` — a PNG data URL from the signing page's canvas is
//   stamped onto the base PDF and saved as the customer's signed copy.
// - `type: 'photo'` — the customer already uploaded a photo of a signed
//   printout via the existing public POST /api/upload/image, and this
//   just records that URL against the order.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementSign);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }
  if (!order.approvedAt) {
    return NextResponse.json({ error: 'This order has not been approved yet.' }, { status: 409 });
  }
  if (order.signedDocumentUrl) {
    return NextResponse.json({ error: 'This agreement has already been signed.' }, { status: 409 });
  }

  let signedDocumentUrl: string;

  if (type === 'drawn') {
    const signatureDataUrl = typeof body?.signatureDataUrl === 'string' ? body.signatureDataUrl : '';
    if (!signatureDataUrl.startsWith('data:image/png')) {
      return NextResponse.json({ error: 'A valid drawn signature is required.' }, { status: 400 });
    }
    const basePdf = await buildSalesAgreementPdf(order);
    const signedPdf = await stampSignatureOnPdf(basePdf, signatureDataUrl);

    const uploadDir = path.join(UPLOADS_ROOT, 'signed-agreements');
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const filename = `${order.orderNo}-${Date.now()}.pdf`;
    await writeFile(path.join(uploadDir, filename), Buffer.from(signedPdf));
    signedDocumentUrl = `/uploads/signed-agreements/${filename}`;
  } else {
    const photoUrl = typeof body?.photoUrl === 'string' ? body.photoUrl.trim() : '';
    if (!photoUrl.startsWith('/uploads/')) {
      return NextResponse.json({ error: 'A valid uploaded photo is required.' }, { status: 400 });
    }
    signedDocumentUrl = photoUrl;
  }

  const updated = await prisma.salesOrder.update({
    where: { id: orderId },
    data: { signedDocumentUrl, signedAt: new Date() },
  });

  return NextResponse.json({ signedDocumentUrl: updated.signedDocumentUrl, signedAt: updated.signedAt });
}
