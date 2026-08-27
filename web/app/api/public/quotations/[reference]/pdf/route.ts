import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { buildSalesQuotationPdf } from '@/lib/services/sales/salesQuotationPdf';

// Public "display by link" view of a formal sales quotation — looked up by
// the customer-facing reference (GY-SQ-...), not the raw row id, matching
// the /api/public/status lookup convention. Same access pattern as the
// public sales agreement PDF (web/app/api/agreement/[orderId]/pdf/route.ts):
// always renders live from current row data, no PDF persisted to disk.
export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementView);
  if (rateLimitResult) return rateLimitResult;

  const { reference } = await params;
  const quotation = await prisma.quotation.findUnique({ where: { reference } });
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }
  if (!quotation.quotationNo) {
    return NextResponse.json({ error: 'This quotation has not been generated yet.' }, { status: 409 });
  }

  const pdfBytes = await buildSalesQuotationPdf(quotation);

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quotation.quotationNo}.pdf"`,
    },
  });
}
