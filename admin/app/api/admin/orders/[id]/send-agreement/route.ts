import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { buildSalesAgreementPdf } from '@/lib/sales/salesAgreementPdf';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

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
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.approvedAt) {
    return NextResponse.json({ error: 'Approve this order before sending the agreement.' }, { status: 409 });
  }
  if (order.signedDocumentUrl) {
    return NextResponse.json({ error: 'This agreement has already been signed and cannot be resent.' }, { status: 409 });
  }

  let notificationSent = false;
  if (order.customerEmail) {
    try {
      const siteUrl = env.app.url.replace(/\/$/, '');
      const signingUrl = `${siteUrl}/agreement/${order.id}`;
      const pdfBytes = await buildSalesAgreementPdf(order);
      notificationSent = await sendStatusEmail({
        to: order.customerEmail,
        name: order.customerName,
        entityType: 'sales order',
        status: 'approved',
        reference: order.orderNo,
        details: 'Your order has been approved! Your sales agreement is attached as a PDF — sign it online (draw a signature or upload a photo of a signed printout) to continue to payment.',
        actionUrl: signingUrl,
        actionLabel: 'Continue',
        attachments: [
          { filename: `${order.orderNo}-agreement.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' },
        ],
      });
    } catch (emailError) {
      console.error('[orders:send-agreement:email]', emailError);
    }
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { agreementSentAt: new Date() },
  });

  return NextResponse.json({ order: updated, notificationSent });
}
