export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  confirmed: 'Confirmed',
  deposit_paid: 'Deposit Paid',
  financing_submitted: 'Financing Submitted',
  financing_approved: 'Financing Approved',
  pdi_pending: 'PDI Pending',
  pdi_completed: 'PDI Completed',
  ready_for_delivery: 'Ready for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'gray',
  pending_approval: 'yellow',
  approved: 'blue',
  confirmed: 'blue',
  deposit_paid: 'green',
  financing_submitted: 'yellow',
  financing_approved: 'green',
  pdi_pending: 'yellow',
  pdi_completed: 'green',
  ready_for_delivery: 'green',
  delivered: 'green',
  cancelled: 'red',
};

export const FINANCING_STATUS_LABELS: Record<string, string> = {
  not_submitted: 'Not Submitted',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  conditional: 'Conditionally Approved',
};

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  paid: 'Paid',
  rejected: 'Rejected',
};

export function getAllowedOrderTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    draft: ['pending_approval', 'cancelled'],
    pending_approval: ['approved', 'cancelled'],
    approved: ['confirmed', 'cancelled'],
    confirmed: ['deposit_paid', 'cancelled'],
    deposit_paid: ['financing_submitted', 'pdi_pending'],
    financing_submitted: ['financing_approved', 'cancelled'],
    financing_approved: ['pdi_pending'],
    pdi_pending: ['pdi_completed'],
    pdi_completed: ['ready_for_delivery'],
    ready_for_delivery: ['delivered'],
    delivered: [],
    cancelled: [],
  };
  return transitions[currentStatus] || [];
}

export function getAllowedFinancingTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    not_submitted: ['submitted'],
    submitted: ['under_review'],
    under_review: ['approved', 'rejected', 'conditional'],
    approved: [],
    rejected: ['submitted'],
    conditional: ['approved', 'rejected'],
  };
  return transitions[currentStatus] || [];
}
