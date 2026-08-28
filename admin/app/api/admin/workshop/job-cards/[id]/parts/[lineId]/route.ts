import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { updatePartLine } from '@/lib/services/workshop/jobCardPartsService';

// FR-401 (UC-07): issue (barcode scan), backorder, or cancel a requested
// part line. Gated on canManagePartsIssue — a distinct, parts-counter action
// from canManageJobCards, which only lets an advisor request a part.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManagePartsIssue) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { lineId } = await params;
  const body = await request.json();
  const { action } = body as { action: 'issue' | 'backorder' | 'cancel' };

  const result = await updatePartLine(lineId, action, session!.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ jobCardPart: result.line });
}
