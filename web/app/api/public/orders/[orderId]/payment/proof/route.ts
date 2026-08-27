import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Customer submits a bank-transfer receipt (uploaded via
// /api/upload/document first) — moves the order to PENDING_REVIEW for
// staff to confirm/reject (see admin/app/api/admin/orders/[id]/payment/confirm).
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentSubmit);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const proofUrl = body?.proofUrl;
  if (typeof proofUrl !== 'string' || !proofUrl.startsWith('/uploads/')) {
    return NextResponse.json({ error: 'A valid proofUrl is required.' }, { status: 400 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.countersignedAt) {
    return NextResponse.json({ error: 'This order is not yet ready for payment.' }, { status: 409 });
  }
  if (order.paymentStatus !== 'UNPAID') {
    return NextResponse.json({ error: 'A payment has already been submitted for this order.' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id: orderId },
    data: { paymentProofUrl: proofUrl, paymentStatus: 'PENDING_REVIEW', paymentSubmittedAt: new Date() },
  });

  return NextResponse.json({ paymentStatus: updated.paymentStatus, paymentProofUrl: updated.paymentProofUrl });
}
