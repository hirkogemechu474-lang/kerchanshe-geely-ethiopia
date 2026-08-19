import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const claim = await prisma.warrantyClaim.findUnique({
    where: { id },
    include: {
      jobCard: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

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
  const claim = await prisma.warrantyClaim.findUnique({ where: { id } });
  if (!claim) {
    return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
  }

  if (claim.status !== 'DRAFTED' && claim.status !== 'REJECTED') {
    return NextResponse.json(
      { error: `Cannot edit a claim in status ${claim.status}.` },
      { status: 409 }
    );
  }

  try {
    const body = await request.json();
    const { defectCode, component, diagnosticCodes, description, photoUrls } = body;

    const updated = await prisma.warrantyClaim.update({
      where: { id },
      data: {
        ...(defectCode !== undefined && { defectCode }),
        ...(component !== undefined && { component }),
        ...(diagnosticCodes !== undefined && { diagnosticCodes }),
        ...(description !== undefined && { description }),
        ...(photoUrls !== undefined && { photoUrls }),
      },
    });

    return NextResponse.json({ claim: updated });
  } catch (error) {
    console.error('Error updating warranty claim:', error);
    return NextResponse.json({ error: 'Failed to update warranty claim' }, { status: 500 });
  }
}
