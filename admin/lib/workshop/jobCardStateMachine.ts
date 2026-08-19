import type { JobCardStatus } from '@prisma/client';

// Job card overdue threshold (BR-007). Not yet backed by a Settings row —
// hardcoded default per BRD §51, revisit if/when workshop settings are built.
export const JOB_CARD_OVERDUE_BUSINESS_DAYS = 3;

export interface JobCardTransitionContext {
  isWarrantyOrGoodwill: boolean;
  customerApprovedAt: Date | null;
  qcPassed: boolean | null;
}

// Forward flow (BRD §14.1): Draft/Check-in -> Diagnosis/Estimate -> Awaiting
// Approval -> In Progress -> (Parts Waiting) -> Quality Control -> Invoiced/Closed.
// Exception paths: Awaiting Bay (no bay free yet), Cancelled (from any open
// state), and the QC-fail rework loop back to In Progress.
const FORWARD_TRANSITIONS: Record<JobCardStatus, JobCardStatus[]> = {
  DRAFT_CHECKIN: ['AWAITING_BAY', 'DIAGNOSIS_ESTIMATE', 'CANCELLED'],
  AWAITING_BAY: ['DIAGNOSIS_ESTIMATE', 'CANCELLED'],
  DIAGNOSIS_ESTIMATE: ['AWAITING_APPROVAL', 'CANCELLED'],
  AWAITING_APPROVAL: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PARTS_WAITING', 'QUALITY_CONTROL', 'CANCELLED'],
  PARTS_WAITING: ['IN_PROGRESS', 'CANCELLED'],
  QUALITY_CONTROL: ['IN_PROGRESS', 'INVOICED_CLOSED'], // fail -> rework, pass -> invoice
  INVOICED_CLOSED: [],
  CANCELLED: [],
};

export class JobCardTransitionError extends Error {}

/** Valid next states from the current status, given the job card's current flags. */
export function getAllowedTransitions(
  status: JobCardStatus,
  ctx: JobCardTransitionContext
): JobCardStatus[] {
  return FORWARD_TRANSITIONS[status].filter((next) => {
    try {
      assertTransitionAllowed(status, next, ctx);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Throws JobCardTransitionError with a specific message if the transition
 * violates a business rule. This is the single source of truth used by both
 * the status API route and the admin UI (to disable invalid buttons) so the
 * rules can't drift between frontend and backend.
 */
export function assertTransitionAllowed(
  from: JobCardStatus,
  to: JobCardStatus,
  ctx: JobCardTransitionContext
): void {
  if (from === to) {
    throw new JobCardTransitionError('Job card is already in this status.');
  }

  if (!FORWARD_TRANSITIONS[from].includes(to)) {
    throw new JobCardTransitionError(`Cannot move a job card from ${from} to ${to}.`);
  }

  // BR-004: cannot start repair work until the customer has approved the
  // estimate, unless the job is flagged warranty/goodwill.
  if (to === 'IN_PROGRESS' && from !== 'PARTS_WAITING' && from !== 'QUALITY_CONTROL') {
    if (!ctx.isWarrantyOrGoodwill && !ctx.customerApprovedAt) {
      throw new JobCardTransitionError(
        'Cannot move to In Progress without customer approval, unless flagged as warranty/goodwill.'
      );
    }
  }

  // BR-005: cannot invoice/close until Quality Control has passed.
  if (to === 'INVOICED_CLOSED' && ctx.qcPassed !== true) {
    throw new JobCardTransitionError('Cannot invoice/close a job card until QC has passed.');
  }
}

/** BR-007: flag job cards open longer than the configured business-day threshold. */
export function isOverdue(openTs: Date, status: JobCardStatus, now: Date = new Date()): boolean {
  if (status === 'INVOICED_CLOSED' || status === 'CANCELLED') return false;
  let businessDays = 0;
  const cursor = new Date(openTs);
  while (cursor < now && businessDays < JOB_CARD_OVERDUE_BUSINESS_DAYS) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) businessDays++;
  }
  return businessDays >= JOB_CARD_OVERDUE_BUSINESS_DAYS && cursor <= now;
}

export const JOB_CARD_STATUS_LABELS: Record<JobCardStatus, string> = {
  DRAFT_CHECKIN: 'Draft / Check-in',
  AWAITING_BAY: 'Awaiting Bay',
  DIAGNOSIS_ESTIMATE: 'Diagnosis / Estimate',
  AWAITING_APPROVAL: 'Awaiting Approval',
  IN_PROGRESS: 'In Progress',
  PARTS_WAITING: 'Parts Waiting',
  QUALITY_CONTROL: 'Quality Control',
  INVOICED_CLOSED: 'Invoiced / Closed',
  CANCELLED: 'Cancelled',
};

// Tailwind classes for status pills, following the BRD's color convention
// (§21: orange = waiting/attention, green = free/complete, blue = in progress).
export const JOB_CARD_STATUS_COLORS: Record<JobCardStatus, string> = {
  DRAFT_CHECKIN: 'bg-gray-100 text-gray-700',
  AWAITING_BAY: 'bg-orange-100 text-orange-700',
  DIAGNOSIS_ESTIMATE: 'bg-blue-100 text-blue-700',
  AWAITING_APPROVAL: 'bg-orange-100 text-orange-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  PARTS_WAITING: 'bg-orange-100 text-orange-700',
  QUALITY_CONTROL: 'bg-purple-100 text-purple-700',
  INVOICED_CLOSED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
