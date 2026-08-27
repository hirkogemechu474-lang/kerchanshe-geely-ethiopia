import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { mockPayOrder } from '@/lib/services/orders/orderPaymentService';

// "Pay Online" mock — no real payment gateway exists yet (see the older
// web/app/api/payments/[paymentId]/authorize/route.ts, a Message-based
// mock this order-native flow deliberately doesn't reuse). Skips straight
// to PAID with no staff review, since a real gateway would confirm the
// charge itself.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentSubmit);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const result = await mockPayOrder(orderId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ paymentStatus: result.paymentStatus, paymentConfirmedAt: result.paymentConfirmedAt });
}
