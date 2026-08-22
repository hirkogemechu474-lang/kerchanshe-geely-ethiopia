import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextInvoiceNo } from '@/lib/sales/orderNumber';
import { buildSalesInvoicePdf } from '@/lib/sales/salesInvoicePdf';
import { sendStatusEmail } from '@/lib/status-email';

/**
 * GET /api/admin/orders/[id]/invoice — the invoice PDF. 409 until generated.
 * POST /api/admin/orders/[id]/invoice — generates the invoice (one-way;
 * 409 if already generated) and emails it to the customer. Deliberately
 * minimal scope, mirroring JobCard.invoiceAmount: a single amount, not a
 * line-item invoice/AR posting (needs an ERP this codebase doesn't have).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.invoicedAt) {
    return NextResponse.json({ error: 'This order has not been invoiced yet.' }, { status: 409 });
  }

  const pdfBytes = await buildSalesInvoicePdf(order);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${order.invoiceNo}.pdf"`,
    },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.invoicedAt) {
    return NextResponse.json({ error: 'This order has already been invoiced' }, { status: 409 });
  }

  const invoiceAmount = body.invoiceAmount !== undefined && body.invoiceAmount !== null
    ? Number(body.invoiceAmount)
    : order.totalPrice;

  const invoiceNo = await nextInvoiceNo();
  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { invoiceNo, invoiceAmount, invoicedAt: new Date(), invoicedById: session!.user.id },
  });

  let notificationSent = false;
  if (updated.customerEmail) {
    try {
      const pdfBytes = await buildSalesInvoicePdf(updated);
      notificationSent = await sendStatusEmail({
        to: updated.customerEmail,
        name: updated.customerName,
        entityType: 'sales order',
        status: 'invoiced',
        reference: updated.orderNo,
        details: `Your invoice ${invoiceNo} is attached.`,
        attachments: [{ filename: `${invoiceNo}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }],
      });
    } catch (emailError) {
      console.error('[orders:invoice:email]', emailError);
    }
  }

  return NextResponse.json({ order: updated, notificationSent });
}
