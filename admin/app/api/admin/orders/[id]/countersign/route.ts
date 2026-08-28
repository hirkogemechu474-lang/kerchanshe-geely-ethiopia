import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { countersignAgreement } from '@/lib/services/sales/orderAgreementService';

// Manager countersign step — a second, staff-side sign-off after the
// customer has e-signed the agreement (see .../[id]/route.ts's
// signedDocumentUrl PATCH and web/app/api/agreement/[orderId]/sign/route.ts).
// Unlike the customer's signature, this doesn't capture a drawn image —
// just identity + timestamp, matching approvedAt/approvedById. Gated on the
// canCountersignAgreements permission (editable per-role in Roles &
// Permissions — see admin/lib/auth/permissionGroups.ts) rather than a
// hardcoded role check, so this authority can be granted/revoked without a
// code change. Immediately emails the customer a payment link.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canCountersignAgreements) {
    return NextResponse.json({ error: 'You do not have permission to countersign agreements.' }, { status: 403 });
  }

  const { id } = await params;
  const result = await countersignAgreement(id, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order, notificationSent: result.notificationSent });
}
