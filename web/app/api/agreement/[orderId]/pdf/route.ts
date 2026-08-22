import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { buildSalesAgreementPdf } from '@/lib/sales/salesAgreementPdf';

// Public — same access-token pattern as the summary route. Always renders
// the unsigned base agreement live from current order data (matches
// admin's GET /api/admin/orders/[id]/agreement exactly, since both share
// the same generator module).
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }
  if (!order.approvedAt) {
    return NextResponse.json({ error: 'This order has not been approved yet.' }, { status: 409 });
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
