import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { convertQuotationToOrder } from '@/lib/services/sales/convertQuotationToOrderService';

// UC-12 Book Order & PDI (BRD §6.1): converts an accepted quotation into a
// bookable sales order and seeds its default PDI checklist. A quotation can
// be converted at most once — SalesOrder.quotationId is unique.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const result = await convertQuotationToOrder(id, session!.user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error, orderId: result.orderId }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order }, { status: 201 });
}
