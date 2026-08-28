import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { quotationRepository } from '@/repositories/quotationRepository';
import { buildSalesQuotationPdf } from '@/lib/services/sales/salesQuotationPdf';
import { generateQuotationPdf } from '@/lib/services/quotations/quotationPdfService';

/**
 * GET /api/admin/quotations/[id]/quotation-pdf — the quotation PDF. 409 until generated.
 * POST /api/admin/quotations/[id]/quotation-pdf — saves pricing/vehicle
 * details and generates the quotation number on first use (kept stable
 * across later re-sends). Does NOT email the customer — see
 * .../send-quotation, gated on manager approval via .../approve-quotation.
 * Unlike the sales invoice, this is NOT a one-way lock — a quotation can be
 * revised and regenerated before the deal is finalized.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const quotation = await quotationRepository.findById(id);
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const result = await generateQuotationPdf(id, body);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ quotation: result.quotation });
}
