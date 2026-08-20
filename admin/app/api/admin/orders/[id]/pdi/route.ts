import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

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

  const item = await prisma.pdiChecklistItem.findFirst({ where: { id: itemId, orderId: id } });
  if (!item) {
    return NextResponse.json({ error: 'Checklist item not found on this order' }, { status: 404 });
  }

  const updated = await prisma.pdiChecklistItem.update({
    where: { id: itemId },
    data: isChecked
      ? { isChecked: true, checkedById: session!.user.id, checkedAt: new Date() }
      : { isChecked: false, checkedById: null, checkedAt: null },
  });

  return NextResponse.json({ item: updated });
}
