// Vocabulary must match the real Prisma WarrantyClaimStatus enum exactly
// (DRAFTED/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/REIMBURSED — see
// schema.prisma) — this module previously used an invented lowercase
// vocabulary sharing zero values with the real enum, so any transition
// check built on it silently never matched a real claim's actual status.
export const WARRANTY_CLAIM_STATUS_LABELS: Record<string, string> = {
  DRAFTED: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REIMBURSED: 'Reimbursed',
};

export const WARRANTY_CLAIM_STATUS_COLORS: Record<string, string> = {
  DRAFTED: 'gray',
  SUBMITTED: 'yellow',
  UNDER_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  REIMBURSED: 'green',
};

export function getAllowedClaimTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    DRAFTED: ['SUBMITTED'],
    SUBMITTED: ['UNDER_REVIEW'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: ['REIMBURSED'],
    REJECTED: [],
    REIMBURSED: [],
  };
  return transitions[currentStatus] || [];
}

export class WarrantyClaimTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WarrantyClaimTransitionError';
  }
}

export interface WarrantyClaimSubmitContext {
  defectCode?: string | null;
  photoUrls?: string[] | null;
  warrantyEndDate?: Date | null;
}

export function assertSubmittable(ctx: WarrantyClaimSubmitContext): void {
  if (!ctx.defectCode) {
    throw new WarrantyClaimTransitionError('A defect code is required before submitting.');
  }
  if (!ctx.photoUrls || ctx.photoUrls.length === 0) {
    throw new WarrantyClaimTransitionError('At least one supporting photo is required before submitting.');
  }
  if (ctx.warrantyEndDate && ctx.warrantyEndDate.getTime() < Date.now()) {
    throw new WarrantyClaimTransitionError('Warranty has expired and cannot be claimed.');
  }
}
