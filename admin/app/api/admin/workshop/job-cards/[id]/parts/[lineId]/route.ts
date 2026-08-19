import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { issueJobCardPart, backorderJobCardPart, cancelJobCardPart, PartsIssueError } from '@/lib/workshop/partsIssue';

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

  try {
    const line = await prisma.$transaction((tx) => {
      switch (action) {
        case 'issue':
          return issueJobCardPart(tx, lineId, session!.user.id);
        case 'backorder':
          return backorderJobCardPart(tx, lineId);
        case 'cancel':
          return cancelJobCardPart(tx, lineId);
        default:
          throw new PartsIssueError('action must be one of: issue, backorder, cancel');
      }
    });
    return NextResponse.json({ jobCardPart: line });
  } catch (error) {
    if (error instanceof PartsIssueError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error updating job card part:', error);
    return NextResponse.json({ error: 'Failed to update part line' }, { status: 500 });
  }
}
