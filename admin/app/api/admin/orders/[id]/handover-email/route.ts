import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendHandoverEmail } from '@/lib/services/sales/orderHandoverService';

/**
 * POST /api/admin/orders/[id]/handover-email — sends the "your vehicle has
 * been delivered, thank you" confirmation with the invoice PDF re-attached.
 * A separate action from the DELIVERED status transition itself, fired by
 * the dedicated Handover panel right after that transition succeeds. Not a
 * one-way lock — callable again to resend, updating handoverNotifiedAt.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await sendHandoverEmail(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order, notificationSent: result.notificationSent });
}
