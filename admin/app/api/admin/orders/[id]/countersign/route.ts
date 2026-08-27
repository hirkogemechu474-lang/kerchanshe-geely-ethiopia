import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

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
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.signedDocumentUrl) {
    return NextResponse.json({ error: 'The customer has not signed the agreement yet.' }, { status: 409 });
  }
  if (order.countersignedAt) {
    return NextResponse.json({ error: 'This agreement has already been countersigned.' }, { status: 409 });
  }

  let notificationSent = false;
  if (order.customerEmail) {
    try {
      const siteUrl = env.app.url.replace(/\/$/, '');
      notificationSent = await sendStatusEmail({
        to: order.customerEmail,
        name: order.customerName,
        entityType: 'sales order',
        status: 'countersigned',
        reference: order.orderNo,
        details: 'Your signed agreement has been countersigned by our sales manager. Please complete payment to proceed with your order.',
        actionUrl: `${siteUrl}/payment/order/${order.id}`,
        actionLabel: 'Pay Now',
      });
    } catch (emailError) {
      console.error('[orders:countersign:email]', emailError);
    }
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { countersignedAt: new Date(), countersignedById: session!.user.id },
  });

  return NextResponse.json({ order: updated, notificationSent });
}
