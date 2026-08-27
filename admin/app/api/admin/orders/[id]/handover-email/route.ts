import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { buildSalesInvoicePdf } from '@/lib/services/sales/salesInvoicePdf';
import { sendStatusEmail } from '@/lib/status-email';

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
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.status !== 'DELIVERED') {
    return NextResponse.json({ error: 'This order has not been marked delivered yet.' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { handoverNotifiedAt: new Date() },
  });

  let notificationSent = false;
  if (updated.customerEmail) {
    try {
      const attachments = [];
      if (updated.invoicedAt) {
        const pdfBytes = await buildSalesInvoicePdf(updated);
        attachments.push({ filename: `${updated.invoiceNo || updated.orderNo}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' });
      }
      notificationSent = await sendStatusEmail({
        to: updated.customerEmail,
        name: updated.customerName,
        entityType: 'sales order',
        status: 'delivered',
        reference: updated.orderNo,
        details: `Your ${updated.vehicleModel} has been delivered. Thank you for choosing Geely Ethiopia — your invoice/receipt is attached for your records.`,
        attachments,
      });
    } catch (emailError) {
      console.error('[orders:handover-email]', emailError);
    }
  }

  return NextResponse.json({ order: updated, notificationSent });
}
