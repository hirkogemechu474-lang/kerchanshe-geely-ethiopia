import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { assertClaimTransitionAllowed, WarrantyClaimTransitionError } from '@/lib/services/workshop/warrantyClaimStateMachine';
import type { WarrantyClaimStatus } from '@prisma/client';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const { toStatus, reasonCode, oemPortalRef, approvedAmount, rejectionReason } = body as {
    toStatus: WarrantyClaimStatus;
    reasonCode?: string;
    oemPortalRef?: string;
    approvedAmount?: number;
    rejectionReason?: string;
  };

  if (!toStatus) {
    return NextResponse.json({ error: 'toStatus is required' }, { status: 400 });
  }

  const claim = await prisma.warrantyClaim.findUnique({ where: { id }, include: { jobCard: true } });
  if (!claim) {
    return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
  }

  // Drafting/resubmitting is the applicant's own action; everything from
  // Under Review onward is a distinct manager-only authority (BRD §17.2 RACI
  // separates claim approval from general job-card editing).
  const isApplicantAction = claim.status === 'DRAFTED' || claim.status === 'REJECTED';
  const requiredPermission = isApplicantAction ? 'canManageJobCards' : 'canApproveWarrantyClaims';
  if (!session!.user.permissions[requiredPermission]) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    assertClaimTransitionAllowed(claim.status, toStatus, {
      defectCode: claim.defectCode,
      photoUrls: claim.photoUrls,
      warrantyEndDate: claim.jobCard.warrantyEndDate,
    });
  } catch (err) {
    if (err instanceof WarrantyClaimTransitionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.warrantyClaim.update({
      where: { id },
      data: {
        status: toStatus,
        ...(toStatus === 'SUBMITTED' && { submittedById: session!.user.id, submittedAt: new Date() }),
        ...(oemPortalRef !== undefined && { oemPortalRef }),
        ...(toStatus === 'APPROVED' && approvedAmount !== undefined && { approvedAmount: Number(approvedAmount) }),
        ...(toStatus === 'REJECTED' && { rejectionReason: rejectionReason || null }),
      },
    });

    await tx.warrantyClaimStatusHistory.create({
      data: {
        claimId: id,
        fromStatus: claim.status,
        toStatus,
        changedById: session!.user.id,
        reasonCode: reasonCode || null,
      },
    });

    return result;
  });

  return NextResponse.json({ claim: updated });
}
