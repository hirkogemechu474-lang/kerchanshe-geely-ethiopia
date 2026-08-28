import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getOrderDetail, updateOrderFields } from '@/lib/services/sales/orderDetailService';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const order = await getOrderDetail(id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

// Field-level edits only (financing status, total price, registration,
// commission assignment). Status transitions go through /status; PDI
// toggles go through /pdi; invoice generation and approval go through
// their own dedicated one-way action routes (.../invoice, .../approve).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const result = await updateOrderFields(id, body, session!.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }
    return NextResponse.json({ order: result.order });
  } catch (dbError) {
    console.error('[orders:patch]', dbError);
    return NextResponse.json({ error: 'Update failed. Please try again.' }, { status: 500 });
  }
}
