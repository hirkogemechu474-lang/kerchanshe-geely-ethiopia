export const WARRANTY_CLAIM_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  parts_ordered: 'Parts Ordered',
  in_repair: 'In Repair',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const WARRANTY_CLAIM_STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  submitted: 'yellow',
  under_review: 'blue',
  approved: 'green',
  parts_ordered: 'yellow',
  in_repair: 'blue',
  completed: 'green',
  rejected: 'red',
  cancelled: 'red',
};

export function getAllowedClaimTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['under_review', 'cancelled'],
    under_review: ['approved', 'rejected'],
    approved: ['parts_ordered'],
    parts_ordered: ['in_repair'],
    in_repair: ['completed'],
    completed: [],
    rejected: [],
    cancelled: [],
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
