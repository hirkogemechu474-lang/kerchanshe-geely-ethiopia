import type { WarrantyClaimStatus } from '@prisma/client';

export interface WarrantyClaimTransitionContext {
  defectCode: string | null;
  photoUrls: unknown;
  warrantyEndDate: Date | null;
}

// Forward flow (BRD §14.2): Drafted -> Submitted -> Under Review -> Approved
// -> Reimbursed. Exception path: Rejected can be corrected and resubmitted
// (Rejected -> Submitted), preserving the claim's history rather than
// creating a duplicate record, per FR-501-504.
const FORWARD_TRANSITIONS: Record<WarrantyClaimStatus, WarrantyClaimStatus[]> = {
  DRAFTED: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['REIMBURSED'],
  REJECTED: ['SUBMITTED'],
  REIMBURSED: [],
};

export class WarrantyClaimTransitionError extends Error {}

/** Valid next states from the current status, given the claim's current data. */
export function getAllowedClaimTransitions(
  status: WarrantyClaimStatus,
  ctx: WarrantyClaimTransitionContext
): WarrantyClaimStatus[] {
  return FORWARD_TRANSITIONS[status].filter((next) => {
    try {
      assertClaimTransitionAllowed(status, next, ctx);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Throws WarrantyClaimTransitionError with a specific message if the
 * transition violates a business rule. Single source of truth used by both
 * the status API route and the admin UI, mirroring jobCardStateMachine.ts.
 */
export function assertClaimTransitionAllowed(
  from: WarrantyClaimStatus,
  to: WarrantyClaimStatus,
  ctx: WarrantyClaimTransitionContext
): void {
  if (from === to) {
    throw new WarrantyClaimTransitionError('Claim is already in this status.');
  }

  if (!FORWARD_TRANSITIONS[from].includes(to)) {
    throw new WarrantyClaimTransitionError(`Cannot move a warranty claim from ${from} to ${to}.`);
  }

  // FR-501/502: submission (including resubmission after rejection) requires
  // eligibility plus mandatory defect-code and photo-evidence fields.
  if (to === 'SUBMITTED') {
    assertSubmittable(ctx);
  }
}

/** Standalone check so the UI can show why the Submit button is disabled before attempting it. */
export function assertSubmittable(ctx: WarrantyClaimTransitionContext): void {
  if (!ctx.defectCode || !ctx.defectCode.trim()) {
    throw new WarrantyClaimTransitionError('A defect code is required before submission.');
  }

  const photos = Array.isArray(ctx.photoUrls) ? ctx.photoUrls : [];
  if (photos.length === 0) {
    throw new WarrantyClaimTransitionError('At least one photo attachment is required before submission.');
  }

  if (ctx.warrantyEndDate && ctx.warrantyEndDate.getTime() < Date.now()) {
    throw new WarrantyClaimTransitionError(
      `Vehicle warranty expired on ${ctx.warrantyEndDate.toLocaleDateString()}; this claim cannot be submitted.`
    );
  }
}

export const WARRANTY_CLAIM_STATUS_LABELS: Record<WarrantyClaimStatus, string> = {
  DRAFTED: 'Drafted',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REIMBURSED: 'Reimbursed',
};

// Tailwind classes for status pills, following the same convention as
// JOB_CARD_STATUS_COLORS (§21: orange = waiting/attention, green = complete).
export const WARRANTY_CLAIM_STATUS_COLORS: Record<WarrantyClaimStatus, string> = {
  DRAFTED: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-purple-100 text-purple-700',
  REJECTED: 'bg-red-100 text-red-700',
  REIMBURSED: 'bg-green-100 text-green-700',
};
