import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { buildHandoverPdf } from '@/lib/sales/handoverPdf';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

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
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.deliveredAt) {
    return NextResponse.json({ error: 'Mark this order Delivered before sending the handover sign-off link.' }, { status: 409 });
  }
  if (order.handoverSignedDocumentUrl) {
    return NextResponse.json({ error: 'This handover has already been signed and cannot be resent.' }, { status: 409 });
  }

  let notificationSent = false;
  if (order.customerEmail) {
    try {
      const siteUrl = env.app.url.replace(/\/$/, '');
      const signingUrl = `${siteUrl}/handover/${order.id}`;
      const pdfBytes = await buildHandoverPdf(order);
      notificationSent = await sendStatusEmail({
        to: order.customerEmail,
        name: order.customerName,
        entityType: 'vehicle handover',
        status: 'delivered',
        reference: order.orderNo,
        details: 'Please confirm receipt of your vehicle — sign the handover confirmation online (draw a signature or upload a photo of a signed printout).',
        actionUrl: signingUrl,
        actionLabel: 'Confirm Handover',
        attachments: [
          { filename: `${order.orderNo}-handover.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' },
        ],
      });
    } catch (emailError) {
      console.error('[orders:send-handover-signoff:email]', emailError);
    }
  }

  return NextResponse.json({ notificationSent });
}
