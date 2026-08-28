import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { transitionClaimStatus } from '@/lib/services/workshop/warrantyClaimService';
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

  const result = await transitionClaimStatus(id, toStatus, reasonCode, oemPortalRef, approvedAmount, rejectionReason, session!.user.id, {
    canManageJobCards: session!.user.permissions.canManageJobCards,
    canApproveWarrantyClaims: session!.user.permissions.canApproveWarrantyClaims,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ claim: result.claim });
}
