import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Public order/payment summary for the self-service payment page — same
// "order id as access token" pattern as /api/agreement/[orderId]. Only
// usable once a sales manager has countersigned (see
// admin/app/api/admin/orders/[id]/countersign/route.ts), even if the URL
// is bookmarked/guessed before that point.
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.countersignedAt) {
    return NextResponse.json({ error: 'This order is not yet ready for payment.' }, { status: 409 });
  }

  return NextResponse.json({
    id: order.id,
    orderNo: order.orderNo,
    customerName: order.customerName,
    vehicleModel: order.vehicleModel,
    totalPrice: order.totalPrice,
    paymentStatus: order.paymentStatus,
    paymentProofUrl: order.paymentProofUrl,
  });
}
