import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getClaimDetail, updateClaimFields } from '@/lib/services/workshop/warrantyClaimService';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const claim = await getClaimDetail(id);

  if (!claim) {
    return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
  }

  return NextResponse.json({ claim });
}

// Field-level edits only, and only while the claim hasn't left the
// applicant's hands (Drafted, or Rejected pending resubmission). Status
// transitions (including resubmit) go through /status.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const result = await updateClaimFields(id, body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ claim: result.claim });
}
