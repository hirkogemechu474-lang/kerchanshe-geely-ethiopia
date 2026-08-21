import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Sales-agent approval step: "Sales Quotation -> Approval by sales agent ->
// Generate Agreement -> e-sign/attach" (see docs/SWMS-INTEGRATION-BACKLOG.md
// Phase 16). Approving unlocks the printable agreement at
// GET /api/admin/orders/[id]/agreement — the document is rendered on demand
// from live order data, not generated/stored as a separate step. Reuses
// canManageQuotations rather than a new permission flag: the diagram names
// the approver as "a sales agent," the same actor who already manages this
// order.
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

  if (order.approvedAt) {
    return NextResponse.json({ error: 'This order is already approved' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { approvedAt: new Date(), approvedById: session!.user.id },
  });

  return NextResponse.json({ order: updated });
}
