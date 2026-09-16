// Real JobCardStatus enum values (see backend/prisma/schema.prisma) — this
// file previously used a made-up draft/open/assigned/... status vocabulary
// that shared no value with the real enum, so every job card's status
// badge/label rendered blank and getAllowedTransitions() always returned []
// for a real job card, silently hiding every status-change button except
// the two hardcoded ones in JobCardDetail.tsx's dedicated QC panel.
export const JOB_CARD_STATUS_LABELS: Record<string, string> = {
  DRAFT_CHECKIN: 'Draft / Check-In',
  AWAITING_BAY: 'Awaiting Bay',
  DIAGNOSIS_ESTIMATE: 'Diagnosis & Estimate',
  AWAITING_APPROVAL: 'Awaiting Customer Approval',
  IN_PROGRESS: 'In Progress',
  PARTS_WAITING: 'Parts Waiting',
  QUALITY_CONTROL: 'Quality Control',
  INVOICED_CLOSED: 'Invoiced / Closed',
  RELEASED: 'Released to Customer',
  CANCELLED: 'Cancelled',
};

export const JOB_CARD_STATUS_COLORS: Record<string, string> = {
  DRAFT_CHECKIN: 'bg-gray-100 text-gray-700',
  AWAITING_BAY: 'bg-yellow-100 text-yellow-800',
  DIAGNOSIS_ESTIMATE: 'bg-yellow-100 text-yellow-800',
  AWAITING_APPROVAL: 'bg-orange-100 text-orange-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PARTS_WAITING: 'bg-orange-100 text-orange-800',
  QUALITY_CONTROL: 'bg-purple-100 text-purple-800',
  INVOICED_CLOSED: 'bg-green-100 text-green-800',
  RELEASED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function getAllowedTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    DRAFT_CHECKIN: ['AWAITING_BAY', 'CANCELLED'],
    AWAITING_BAY: ['DIAGNOSIS_ESTIMATE', 'CANCELLED'],
    DIAGNOSIS_ESTIMATE: ['AWAITING_APPROVAL', 'CANCELLED'],
    AWAITING_APPROVAL: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['PARTS_WAITING', 'QUALITY_CONTROL', 'CANCELLED'],
    PARTS_WAITING: ['IN_PROGRESS', 'CANCELLED'],
    // QUALITY_CONTROL -> INVOICED_CLOSED is handled by JobCardDetail's
    // dedicated QC sign-off panel (records qcPassed/qcNotes at the same
    // time), not a generic status button here.
    QUALITY_CONTROL: [],
    INVOICED_CLOSED: ['RELEASED'],
    RELEASED: [],
    CANCELLED: [],
  };
  return transitions[currentStatus] || [];
}
