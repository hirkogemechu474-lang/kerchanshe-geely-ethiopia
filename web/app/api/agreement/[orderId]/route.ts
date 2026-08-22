import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Public order summary for the self-service agreement signing page. The
// order's own id (a random UUID, only ever shared via the approval email)
// is the access token — same security-through-obscurity pattern as the
// CSI survey's jobCardId link. No admin session is available to a
// customer, so this reads SalesOrder directly via web's own Prisma client
// (same shared DB — same precedent as the showroom-visit -> SalesOrder
// linkage already built).
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: { quotation: { select: { message: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }
  if (!order.approvedAt) {
    return NextResponse.json({ error: 'This order has not been approved yet.' }, { status: 409 });
  }

  // Best-effort vehicle lookup so "Continue to Payment" can preselect the
  // right vehicle — SalesOrder.vehicleModel is a plain string, not an FK
  // (Phase 8's deliberate scope decision: no VIN-level catalog link), so
  // this is a name match, not a guaranteed resolution.
  const vehicle = await prisma.vehicle.findFirst({
    where: { name: order.vehicleModel, isActive: true, status: 'published' },
    select: { id: true },
  });

  // If this order came from a direct purchase (not just a quote request),
  // the linked Quotation's message embeds the original purchase reference
  // (see linkPurchaseToSalesPipeline in .../public/purchases/route.ts) —
  // same text-correlation convention /api/payments/initiate already uses.
  // Recovering it lets "Continue to Payment" resume that exact purchase
  // instead of asking the customer to fill the purchase form a second time.
  const purchaseReferenceMatch = order.quotation?.message?.match(/Purchase reference: (\S+)/);
  const purchaseReference = purchaseReferenceMatch?.[1] || null;

  return NextResponse.json({
    id: order.id,
    orderNo: order.orderNo,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    vehicleModel: order.vehicleModel,
    vehicleId: vehicle?.id || null,
    signedDocumentUrl: order.signedDocumentUrl,
    signedAt: order.signedAt,
    quotationId: order.quotationId,
    purchaseReference,
  });
}
