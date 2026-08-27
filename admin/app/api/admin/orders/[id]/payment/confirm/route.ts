import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Staff review of a customer-submitted bank-transfer proof (see
// web/app/api/public/orders/[orderId]/payment/proof/route.ts). Only
// meaningful while paymentStatus is PENDING_REVIEW — nothing to confirm or
// reject otherwise. `reject` clears the proof so the customer can
// re-submit cleanly rather than keeping a rejected file around.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action;
  if (action !== 'confirm' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "confirm" or "reject"' }, { status: 400 });
  }

  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.paymentStatus !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'No pending payment submission to review.' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data:
      action === 'confirm'
        ? { paymentStatus: 'PAID', paymentConfirmedAt: new Date(), paymentConfirmedById: session!.user.id }
        : { paymentStatus: 'UNPAID', paymentProofUrl: null },
  });

  return NextResponse.json({ order: updated });
}
