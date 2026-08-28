import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { countersignHandover } from '@/lib/services/sales/orderHandoverService';

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
  const result = await countersignHandover(id, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order });
}
