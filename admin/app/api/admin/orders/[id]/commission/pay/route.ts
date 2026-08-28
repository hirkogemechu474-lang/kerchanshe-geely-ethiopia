import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { payCommission } from '@/lib/services/sales/orderOpsService';

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
  const result = await payCommission(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order });
}
