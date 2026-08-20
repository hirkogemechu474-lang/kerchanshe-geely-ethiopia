import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { assertOrderTransitionAllowed, OrderTransitionError } from '@/lib/sales/orderStateMachine';
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

  try {
    assertOrderTransitionAllowed(order.status, toStatus, { pdiComplete });
  } catch (err) {
    if (err instanceof OrderTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.salesOrder.update({
      where: { id },
      data: {
        status: toStatus,
        ...(toStatus === 'DELIVERED' && { deliveredAt: new Date() }),
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
