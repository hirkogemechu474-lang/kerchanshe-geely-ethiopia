import { warrantyClaimRepository } from '@/repositories/warrantyClaimRepository';
import { jobCardRepository } from '@/repositories/jobCardRepository';
import { nextClaimNo } from '@/lib/services/workshop/jobCardNumber';
import { assertClaimTransitionAllowed, WarrantyClaimTransitionError } from '@/lib/services/workshop/warrantyClaimStateMachine';
import type { WarrantyClaimStatus } from '@prisma/client';

// UC-09: list warranty claims, optionally filtered by status.
export async function listClaims(status: WarrantyClaimStatus | null) {
  return warrantyClaimRepository.findMany(status);
}

export type CreateClaimResult =
  | { ok: true; claim: any }
  | { ok: false; httpStatus: 400 | 404 | 500; error: string };

// UC-09: draft a new warranty claim from a job card (FR-501/502).
export async function createClaim(body: any): Promise<CreateClaimResult> {
  const { jobCardId, defectCode, component, diagnosticCodes, description, photoUrls } = body as {
    jobCardId: string;
    defectCode?: string;
    component?: string;
    diagnosticCodes?: string;
    description?: string;
    photoUrls?: string[];
  };

  if (!jobCardId) {
    return { ok: false, httpStatus: 400, error: 'jobCardId is required' };
  }

  const jobCard = await jobCardRepository.findById(jobCardId);
  if (!jobCard) {
    return { ok: false, httpStatus: 404, error: 'Job card not found' };
  }

  try {
    const claimNo = await nextClaimNo();
    const claim = await warrantyClaimRepository.create({
      claimNo,
      jobCard: { connect: { id: jobCardId } },
      defectCode: defectCode || '',
      component: component || null,
      diagnosticCodes: diagnosticCodes || null,
      description: description || null,
      photoUrls: photoUrls && photoUrls.length ? photoUrls : [],
    });
    return { ok: true, claim };
  } catch (error) {
    console.error('Error creating warranty claim:', error);
    return { ok: false, httpStatus: 500, error: 'Failed to create warranty claim' };
  }
}

export async function getClaimDetail(id: string) {
  return warrantyClaimRepository.findByIdWithDetail(id);
}

export type UpdateClaimFieldsResult =
  | { ok: true; claim: any }
  | { ok: false; httpStatus: 404 | 409 | 500; error: string };

// Field-level edits only, and only while the claim hasn't left the
// applicant's hands (Drafted, or Rejected pending resubmission). Status
// transitions (including resubmit) go through transitionClaimStatus.
export async function updateClaimFields(id: string, body: any): Promise<UpdateClaimFieldsResult> {
  const claim = await warrantyClaimRepository.findById(id);
  if (!claim) {
    return { ok: false, httpStatus: 404, error: 'Warranty claim not found' };
  }

  if (claim.status !== 'DRAFTED' && claim.status !== 'REJECTED') {
    return { ok: false, httpStatus: 409, error: `Cannot edit a claim in status ${claim.status}.` };
  }

  const { defectCode, component, diagnosticCodes, description, photoUrls } = body;

  try {
    const updated = await warrantyClaimRepository.update(id, {
      ...(defectCode !== undefined && { defectCode }),
      ...(component !== undefined && { component }),
      ...(diagnosticCodes !== undefined && { diagnosticCodes }),
      ...(description !== undefined && { description }),
      ...(photoUrls !== undefined && { photoUrls }),
    });
    return { ok: true, claim: updated };
  } catch (error) {
    console.error('Error updating warranty claim:', error);
    return { ok: false, httpStatus: 500, error: 'Failed to update warranty claim' };
  }
}

export type TransitionClaimStatusResult =
  | { ok: true; claim: any }
  | { ok: false; httpStatus: 403 | 404 | 409; error: string };

export async function transitionClaimStatus(
  id: string,
  toStatus: WarrantyClaimStatus,
  reasonCode: string | undefined,
  oemPortalRef: string | undefined,
  approvedAmount: number | undefined,
  rejectionReason: string | undefined,
  actingUserId: string,
  permissions: { canManageJobCards: boolean; canApproveWarrantyClaims: boolean }
): Promise<TransitionClaimStatusResult> {
  const claim = await warrantyClaimRepository.findByIdWithJobCard(id);
  if (!claim) {
    return { ok: false, httpStatus: 404, error: 'Warranty claim not found' };
  }

  // Drafting/resubmitting is the applicant's own action; everything from
  // Under Review onward is a distinct manager-only authority (BRD §17.2 RACI
  // separates claim approval from general job-card editing).
  const isApplicantAction = claim.status === 'DRAFTED' || claim.status === 'REJECTED';
  const hasPermission = isApplicantAction ? permissions.canManageJobCards : permissions.canApproveWarrantyClaims;
  if (!hasPermission) {
    return { ok: false, httpStatus: 403, error: 'Forbidden' };
  }

  try {
    assertClaimTransitionAllowed(claim.status, toStatus, {
      defectCode: claim.defectCode,
      photoUrls: claim.photoUrls,
      warrantyEndDate: claim.jobCard.warrantyEndDate,
    });
  } catch (err) {
    if (err instanceof WarrantyClaimTransitionError) {
      return { ok: false, httpStatus: 409, error: err.message };
    }
    throw err;
  }

  const updated = await warrantyClaimRepository.transitionStatus(
    id,
    {
      status: toStatus,
      ...(toStatus === 'SUBMITTED' && { submittedById: actingUserId, submittedAt: new Date() }),
      ...(oemPortalRef !== undefined && { oemPortalRef }),
      ...(toStatus === 'APPROVED' && approvedAmount !== undefined && { approvedAmount: Number(approvedAmount) }),
      ...(toStatus === 'REJECTED' && { rejectionReason: rejectionReason || null }),
    },
    { fromStatus: claim.status, toStatus, changedById: actingUserId, reasonCode: reasonCode || null }
  );

  return { ok: true, claim: updated };
}
