import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getAgreementPdf } from '@/lib/services/sales/orderAgreementService';

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
  const result = await getAgreementPdf(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return new NextResponse(Buffer.from(result.pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${result.orderNo}-agreement.pdf"`,
    },
  });
}
