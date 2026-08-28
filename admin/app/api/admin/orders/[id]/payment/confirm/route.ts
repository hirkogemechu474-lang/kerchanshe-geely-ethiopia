import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { confirmPayment } from '@/lib/services/sales/orderOpsService';

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

  const result = await confirmPayment(id, action, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order });
}
