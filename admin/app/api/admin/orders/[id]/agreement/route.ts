import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { buildSalesAgreementPdf } from '@/lib/services/sales/salesAgreementPdf';

/**
 * GET /api/admin/orders/[id]/agreement
 *
 * Renders the sales agreement as a real PDF for a booked order — staff can
 * view/download/print it, and the same PDF is attached to the approval
 * email. Generated fresh from live order data on every request (no
 * separate stored document) — it only becomes viewable once the order has
 * been approved (see POST .../approve).
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
  if (!order.approvedAt) {
    return NextResponse.json({ error: 'This order must be approved before the agreement can be viewed.' }, { status: 409 });
  }

  const pdfBytes = await buildSalesAgreementPdf(order);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${order.orderNo}-agreement.pdf"`,
    },
  });
}
