import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { assertOrderTransitionAllowed, OrderTransitionError } from '@/lib/services/sales/orderStateMachine';
import type { OrderStatus } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { toStatus, reasonCode } = body as { toStatus: OrderStatus; reasonCode?: string };

  if (!toStatus) {
    return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id }, include: { pdiItems: true } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const pdiComplete = order.pdiItems.length > 0 && order.pdiItems.every((p) => p.isChecked);
  const agreementComplete = Boolean(order.approvedAt) && Boolean(order.signedDocumentUrl);
  const paymentComplete = order.paymentStatus === 'PAID';
  const registrationComplete = Boolean(order.registeredAt);
  const invoiceComplete = Boolean(order.invoicedAt);

  try {
    assertOrderTransitionAllowed(order.status, toStatus, { pdiComplete, agreementComplete, paymentComplete, registrationComplete, invoiceComplete });
  } catch (err) {
    if (err instanceof OrderTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  // Commission is earned automatically the moment an order is delivered —
  // a consequence of delivery, not a prerequisite for it, so this doesn't
  // participate in the transition gate above. Only computed if a sales
  // agent is actually on file; nothing changes for orders with none.
  const earnsCommissionNow =
    toStatus === 'DELIVERED' && Boolean(order.salesAgentId) && order.commissionStatus !== 'PAID';
  const commissionAmount = earnsCommissionNow
    ? (order.totalPrice ?? 0) * ((order.commissionRate ?? 0) / 100)
    : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.salesOrder.update({
      where: { id },
      data: {
        status: toStatus,
        ...(toStatus === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(earnsCommissionNow && { commissionStatus: 'EARNED', commissionAmount }),
      },
    });

    await tx.salesOrderStatusHistory.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus,
        changedById: session!.user.id,
        reasonCode: reasonCode || null,
      },
    });

    return result;
  });

  return NextResponse.json({ order: updated });
}
