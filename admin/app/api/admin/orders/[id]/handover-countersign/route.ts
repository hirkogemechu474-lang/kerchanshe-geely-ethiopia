import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Manager countersign step for the vehicle handover — the same authority
// (canCountersignAgreements) and identity+timestamp-only shape as
// .../[id]/countersign (the sales-agreement countersign), just closing out
// the later handover stage instead of the earlier agreement stage.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canCountersignAgreements) {
    return NextResponse.json({ error: 'You do not have permission to countersign handovers.' }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.salesOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (!order.handoverSignedDocumentUrl) {
    return NextResponse.json({ error: 'The customer has not signed the handover confirmation yet.' }, { status: 409 });
  }
  if (order.handoverCountersignedAt) {
    return NextResponse.json({ error: 'This handover has already been countersigned.' }, { status: 409 });
  }

  const updated = await prisma.salesOrder.update({
    where: { id },
    data: { handoverCountersignedAt: new Date(), handoverCountersignedById: session!.user.id },
  });

  return NextResponse.json({ order: updated });
}
