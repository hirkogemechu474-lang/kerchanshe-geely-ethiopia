import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getInvoicePdf, generateInvoice } from '@/lib/services/sales/orderInvoiceService';

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
  const result = await getInvoicePdf(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return new NextResponse(Buffer.from(result.pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${result.invoiceNo}.pdf"`,
    },
  });
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await generateInvoice(id, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order, notificationSent: result.notificationSent });
}
