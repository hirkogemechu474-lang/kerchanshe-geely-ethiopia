import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';

// Public order summary for the self-service vehicle-handover signing page —
// same security-through-obscurity pattern as web/app/api/agreement/[orderId]
// (the order's own random-UUID id, only ever shared via the handover-invite
// email, is the access token).
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.handoverView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const order = await salesOrderRepository.findById(orderId);
  if (!order) {
    return NextResponse.json({ error: 'Handover not found' }, { status: 404 });
  }
  if (!order.deliveredAt) {
    return NextResponse.json({ error: 'This order has not been marked as delivered yet.' }, { status: 409 });
  }

  return NextResponse.json({
    id: order.id,
    orderNo: order.orderNo,
    customerName: order.customerName,
    vehicleModel: order.vehicleModel,
    deliveredAt: order.deliveredAt,
    handoverSignedDocumentUrl: order.handoverSignedDocumentUrl,
    handoverSignedAt: order.handoverSignedAt,
    handoverCountersignedAt: order.handoverCountersignedAt,
  });
}
