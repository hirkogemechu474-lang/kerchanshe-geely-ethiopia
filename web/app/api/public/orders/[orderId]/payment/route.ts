import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { getOrderPaymentSummary } from '@/lib/services/orders/orderPaymentService';

// Public order/payment summary for the self-service payment page — same
// "order id as access token" pattern as /api/agreement/[orderId]. Only
// usable once a sales manager has countersigned (see
// admin/app/api/admin/orders/[id]/countersign/route.ts), even if the URL
// is bookmarked/guessed before that point.
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const result = await getOrderPaymentSummary(orderId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json(result.order);
}
