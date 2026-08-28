import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { rejectAgreement } from '@/lib/services/sales/orderAgreementService';

// "Return for Correction" — the manager-countersign step's reject
// counterpart. Same canCountersignAgreements gate as .../countersign.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canCountersignAgreements) {
    return NextResponse.json({ error: 'You do not have permission to reject agreements.' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!reason) {
    return NextResponse.json({ error: 'A rejection reason is required.' }, { status: 400 });
  }

  const result = await rejectAgreement(id, session!.user.id, reason);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ order: result.order });
}
