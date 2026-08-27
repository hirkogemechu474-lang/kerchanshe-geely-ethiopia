import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// "Pay Online" mock — no real payment gateway exists yet (see the older
// web/app/api/payments/[paymentId]/authorize/route.ts, a Message-based
// mock this order-native flow deliberately doesn't reuse). Skips straight
// to PAID with no staff review, since a real gateway would confirm the
// charge itself.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentSubmit);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
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
    data: { paymentStatus: 'PAID', paymentConfirmedAt: new Date() },
  });

  return NextResponse.json({ paymentStatus: updated.paymentStatus, paymentConfirmedAt: updated.paymentConfirmedAt });
}
