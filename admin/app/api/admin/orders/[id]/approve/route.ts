import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { approveOrder } from '@/lib/services/sales/orderAgreementService';

// Sales-agent approval step: "Sales Quotation -> Approval by sales agent ->
// Generate Agreement -> e-sign/attach" (see docs/SWMS-INTEGRATION-BACKLOG.md
// Phase 16). Approving only finalizes approvedAt/approvedById — this is a
// deliberate draft/review step: the agreement PDF is not built or emailed
// here. Staff preview it (GET /api/admin/orders/[id]/agreement) and can
// still adjust the price before a separate, explicit action
// (POST .../send-agreement) actually generates and emails it to the
// customer. Reuses canManageQuotations rather than a new permission flag:
// the diagram names the approver as "a sales agent," the same actor who
// already manages this order.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageQuotations) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const result = await approveOrder(id, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order });
}
