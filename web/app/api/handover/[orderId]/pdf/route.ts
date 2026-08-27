import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { buildHandoverPdf } from '@/lib/sales/handoverPdf';

// Public — same access-token pattern as the agreement PDF route. Always
// renders the unsigned base handover confirmation live from current order
// data.
export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.handoverView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: 'Handover not found' }, { status: 404 });
  }
  if (!order.deliveredAt) {
    return NextResponse.json({ error: 'This order has not been marked as delivered yet.' }, { status: 409 });
  }

  const pdfBytes = await buildHandoverPdf(order);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${order.orderNo}-handover.pdf"`,
    },
  });
}
