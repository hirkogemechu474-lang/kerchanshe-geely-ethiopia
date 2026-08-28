import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { togglePdiItem } from '@/lib/services/sales/orderOpsService';

// Toggle a single PDI checklist item (BRD API design: PATCH /api/orders/{id}/pdi).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { itemId, isChecked } = await request.json();

  if (!itemId || typeof isChecked !== 'boolean') {
    return NextResponse.json({ error: 'itemId and isChecked are required' }, { status: 400 });
  }

  const result = await togglePdiItem(id, itemId, isChecked, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ item: result.item });
}
