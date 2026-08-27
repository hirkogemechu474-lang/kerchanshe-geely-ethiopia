import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile } from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { resolveUploadUrl } from '@/lib/upload-utils';
import { stampHandoverAgentSignatureText } from '@/lib/sales/handoverPdf';
import { isPdfUrl } from '@/lib/fileType';

// Called server-to-server by
// admin/app/api/admin/orders/[id]/handover-countersign right after it
// records handoverCountersignedAt/handoverCountersignedById — mirrors
// /api/agreement/[orderId]/countersign-stamp exactly, just for the
// handover confirmation instead of the sales agreement.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const agentName = typeof body?.agentName === 'string' ? body.agentName.trim() : '';
  if (!agentName) {
    return NextResponse.json({ error: 'agentName is required' }, { status: 400 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.handoverSignedDocumentUrl || !order.handoverCountersignedAt) {
    return NextResponse.json({ error: 'This order has no countersigned handover to stamp.' }, { status: 409 });
  }
  if (!isPdfUrl(order.handoverSignedDocumentUrl)) {
    return NextResponse.json({ stamped: false, reason: 'signed document is not a PDF' });
  }

  const filePath = resolveUploadUrl(order.handoverSignedDocumentUrl);
  if (!filePath) {
    return NextResponse.json({ error: 'Could not resolve the signed document on disk.' }, { status: 500 });
  }

  try {
    const bytes = await readFile(filePath);
    const stamped = await stampHandoverAgentSignatureText(bytes, agentName, order.handoverCountersignedAt);
    await writeFile(filePath, Buffer.from(stamped));
  } catch (error) {
    console.error('[handover:countersign-stamp]', error);
    return NextResponse.json({ error: 'Failed to stamp the handover confirmation.' }, { status: 500 });
  }

  return NextResponse.json({ stamped: true });
}
