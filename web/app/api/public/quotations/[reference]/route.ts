import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Public quotation summary for the self-service quotation signing page —
// same "reference as access token" pattern as /api/public/quotations/[reference]/pdf,
// looked up by the customer-facing reference (GY-SQ-...), not the raw row
// id. Only usable once a quotation PDF has actually been generated.
export async function GET(request: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.quotationView);
  if (rateLimitResult) return rateLimitResult;

  const { reference } = await params;
  const quotation = await prisma.quotation.findUnique({ where: { reference } });
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }
  if (!quotation.quotationNo) {
    return NextResponse.json({ error: 'This quotation has not been generated yet.' }, { status: 409 });
  }

  return NextResponse.json({
    reference: quotation.reference,
    quotationNo: quotation.quotationNo,
    customerName: quotation.customerName,
    vehicleModel: quotation.vehicleModel,
    signedDocumentUrl: quotation.signedDocumentUrl,
    signedAt: quotation.signedAt,
  });
}
