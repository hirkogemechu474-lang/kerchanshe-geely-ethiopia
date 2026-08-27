import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { computeQuotationTotals } from '@/lib/services/sales/salesQuotationPdf';

// Public quotation price summary, looked up by the raw row id (the `quote`
// query param used by /financing/apply and the two places that generate
// that link — web/app/quote/page.tsx and
// admin/app/api/admin/quotations/[id]/route.ts — both pass the id, not the
// customer-facing reference). Same access-token-via-id pattern as
// /api/agreement/[orderId] and /api/handover/[orderId].
//
// Lets /financing/apply source its purchase price from the actual formal
// Sales Quotation (unitPrice/quantity/discountAmount, set by a Sales
// Consultant via QuotationPdfPanel) instead of the vehicle's generic
// catalog price — and once the customer has e-signed it
// (Quotation.signedAt), that becomes the definitive agreed price.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.quotationView);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({ where: { id } });
  if (!quotation) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  const hasFormalPrice = quotation.unitPrice != null;
  const totals = hasFormalPrice
    ? computeQuotationTotals(quotation.unitPrice!, quotation.quantity || 1, quotation.discountAmount || 0)
    : null;

  return NextResponse.json({
    id: quotation.id,
    reference: quotation.reference,
    vehicleModel: quotation.vehicleModel,
    hasFormalPrice,
    unitPrice: quotation.unitPrice,
    quantity: quotation.quantity,
    discountAmount: quotation.discountAmount,
    totalPrice: totals?.totalPayable ?? null,
    signedAt: quotation.signedAt,
    signedDocumentUrl: quotation.signedDocumentUrl,
    status: quotation.status,
  });
}
