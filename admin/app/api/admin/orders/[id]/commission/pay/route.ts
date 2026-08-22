import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Marks a commission as paid — a separate manual step from it being
// EARNED (which happens automatically on delivery, see .../status).
// Accounting pays the agent on their own schedule, so this is never
// automatic.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (order.commissionStatus !== 'EARNED') {
    return NextResponse.json({ error: 'Commission must be earned (order delivered) before it can be marked paid.' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { commissionStatus: 'PAID' },
  });

  return NextResponse.json({ order: updated });
}
