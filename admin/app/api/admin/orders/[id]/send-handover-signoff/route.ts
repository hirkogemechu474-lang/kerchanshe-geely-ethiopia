import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendHandoverSignoff } from '@/lib/services/sales/orderHandoverService';

/**
 * POST /api/admin/orders/[id]/send-handover-signoff
 *
 * The dual-signature counterpart to send-agreement: emails the customer a
 * link to web/app/handover/[orderId], where they confirm receipt of the
 * vehicle (draw a signature or upload a photo of a signed printout) before
 * a manager countersigns via .../handover-countersign. Requires the order
 * to already be DELIVERED — this is a formal acknowledgement of an already-
 * completed handover, not a gate on marking it delivered in the first
 * place (see OrderHandoverPanel's existing "Complete Handover" action).
 * Resendable, same convention as send-agreement.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await sendHandoverSignoff(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ notificationSent: result.notificationSent });
}
