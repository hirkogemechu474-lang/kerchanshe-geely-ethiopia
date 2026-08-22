import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sendStatusEmail } from '@/lib/status-email';
import { buildSalesAgreementPdf } from '@/lib/sales/salesAgreementPdf';

// Sales-agent approval step: "Sales Quotation -> Approval by sales agent ->
// Generate Agreement -> e-sign/attach" (see docs/SWMS-INTEGRATION-BACKLOG.md
// Phase 16). Approving unlocks the PDF agreement at
// GET /api/admin/orders/[id]/agreement (staff view/print), emails the same
// PDF to the customer, and — per direct follow-up request — the email also
// links to a public self-service page (web/app/agreement/[orderId]) where
// the customer can draw a signature or upload a photo of a signed printout
// and then continue straight to payment. Reuses canManageQuotations rather
// than a new permission flag: the diagram names the approver as "a sales
// agent," the same actor who already manages this order.
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

  if (order.approvedAt) {
    return NextResponse.json({ error: 'This order is already approved' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { approvedAt: new Date(), approvedById: session!.user.id },
  });

  let notificationSent = false;
  if (updated.customerEmail) {
    try {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://geelyethiopia.com').replace(/\/$/, '');
      const signingUrl = `${siteUrl}/agreement/${updated.id}`;
      const pdfBytes = await buildSalesAgreementPdf(updated);
      notificationSent = await sendStatusEmail({
        to: updated.customerEmail,
        name: updated.customerName,
        entityType: 'sales order',
        status: 'approved',
        reference: updated.orderNo,
        details: 'Your sales agreement is attached as a PDF. Sign it online (draw a signature or upload a photo of a signed printout) to continue to payment.',
        actionUrl: signingUrl,
        actionLabel: 'Sign your agreement online',
        attachments: [
          { filename: `${updated.orderNo}-agreement.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' },
        ],
      });
    } catch (emailError) {
      console.error('[orders:approve:email]', emailError);
    }
  }

  return NextResponse.json({ order: updated, notificationSent });
}
