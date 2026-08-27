import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { AdminRole } from '@/lib/auth/types';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

// Manager countersign step — a second, staff-side sign-off after the
// customer has e-signed the agreement (see .../[id]/route.ts's
// signedDocumentUrl PATCH and web/app/api/agreement/[orderId]/sign/route.ts).
// Unlike the customer's signature, this doesn't capture a drawn image —
// just identity + timestamp, matching approvedAt/approvedById. Restricted
// to Sales Manager/Admin (unlike approve/send-agreement, which any rep with
// canManageQuotations can do) since this is explicitly the manager's
// countersignature. Immediately emails the customer a payment link.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  const role = session!.user.role;
  if (
    role !== AdminRole.SALES_MANAGER &&
    role !== AdminRole.ADMIN &&
    role !== AdminRole.SUPER_ADMIN
  ) {
    return NextResponse.json({ error: 'Only a sales manager can countersign this agreement.' }, { status: 403 });
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
