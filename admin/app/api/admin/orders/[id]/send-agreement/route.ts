import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendAgreement } from '@/lib/services/sales/orderAgreementService';

/**
 * POST /api/admin/orders/[id]/send-agreement — the second, explicit step of
 * "Approve -> review/adjust price -> Send". Requires approvedAt to already
 * be set (see .../approve, which deliberately no longer auto-sends). Builds
 * the agreement PDF from current order data and emails it. Not a one-way
 * lock like the invoice — callable again to resend a revised copy after a
 * price adjustment, updating agreementSentAt each time.
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await sendAgreement(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order, notificationSent: result.notificationSent });
}
