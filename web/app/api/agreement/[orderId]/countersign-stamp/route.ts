import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { resolveUploadUrl } from '@/lib/upload-utils';
import { stampAgentSignatureText, stampAgentSignatureImage } from '@/lib/services/sales/salesAgreementPdf';
import { isPdfUrl } from '@/lib/fileType';

// Called server-to-server by admin/app/api/admin/orders/[id]/countersign
// right after it records countersignedAt/countersignedById — the signed
// agreement file only exists on web's disk (web/public/uploads), so admin
// can't stamp it directly. Same id-as-access-token pattern as every other
// public order route; the caller (admin's own server) is the only one who
// would ever know the right orderId + already have a countersign to report.
//
// Uses the countersigning user's own on-file signature image
// (User.signatureUrl, set once via web/app/staff-signature/[token]) when
// they have one, falling back to stamping their typed name for staff who
// haven't set one up yet.
//
// A no-op (not an error) when the signed document is a photo upload
// rather than the drawn-signature PDF — there's no live PDF to stamp
// onto in that case.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const agentId = typeof body?.agentId === 'string' ? body.agentId.trim() : '';
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  const [order, agent] = await Promise.all([
    prisma.salesOrder.findUnique({ where: { id: orderId } }),
    prisma.user.findUnique({ where: { id: agentId }, select: { name: true, signatureUrl: true } }),
  ]);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!agent) {
    return NextResponse.json({ error: 'Countersigning user not found' }, { status: 404 });
  }
  if (!order.signedDocumentUrl || !order.countersignedAt) {
    return NextResponse.json({ error: 'This order has no countersigned agreement to stamp.' }, { status: 409 });
  }
  if (!isPdfUrl(order.signedDocumentUrl)) {
    return NextResponse.json({ stamped: false, reason: 'signed document is not a PDF' });
  }

  const filePath = resolveUploadUrl(order.signedDocumentUrl);
  if (!filePath) {
    return NextResponse.json({ error: 'Could not resolve the signed document on disk.' }, { status: 500 });
  }

  try {
    const bytes = await readFile(filePath);
    let stamped: Uint8Array;
    if (agent.signatureUrl) {
      const signaturePath = resolveUploadUrl(agent.signatureUrl);
      const signatureBytes = signaturePath ? await readFile(signaturePath) : null;
      stamped = signatureBytes
        ? await stampAgentSignatureImage(bytes, signatureBytes, order.countersignedAt)
        : await stampAgentSignatureText(bytes, agent.name, order.countersignedAt);
    } else {
      stamped = await stampAgentSignatureText(bytes, agent.name, order.countersignedAt);
    }
    await writeFile(filePath, Buffer.from(stamped));
  } catch (error) {
    console.error('[agreement:countersign-stamp]', error);
    return NextResponse.json({ error: 'Failed to stamp the agreement.' }, { status: 500 });
  }

  return NextResponse.json({ stamped: true });
}
