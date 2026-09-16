// Real OrderStatus enum values are QUOTED/BOOKED/FINANCING_PENDING/
// READY_FOR_DELIVERY/DELIVERED/CANCELLED (see backend/prisma/schema.prisma).
// Transitions and gates mirror backend/src/services/sales/order.service.ts's
// orderStateMachine + getTransitionBlockReason exactly, so this UI never
// offers a transition the server will reject.
export const ORDER_STATUS_LABELS: Record<string, string> = {
  QUOTED: 'Quoted',
  BOOKED: 'Booked',
  FINANCING_PENDING: 'Financing Pending',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  QUOTED: 'gray',
  BOOKED: 'blue',
  FINANCING_PENDING: 'yellow',
  READY_FOR_DELIVERY: 'blue',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

// Real FinancingStatus enum values (see backend/prisma/schema.prisma).
export const FINANCING_STATUS_LABELS: Record<string, string> = {
  NOT_REQUESTED: 'Not Requested',
  REQUESTED: 'Requested',
  DOCUMENTS_PENDING: 'Documents Pending',
  DOCUMENTS_SUBMITTED: 'Documents Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  CONDITIONALLY_APPROVED: 'Conditionally Approved',
  REJECTED: 'Rejected',
  CUSTOMER_DECLINED: 'Customer Declined',
  DISBURSED: 'Disbursed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Real CommissionStatus enum values (see backend/prisma/schema.prisma).
export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  NOT_APPLICABLE: 'Not Applicable',
  PENDING: 'Pending',
  EARNED: 'Earned',
  PAID: 'Paid',
};

const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  QUOTED: ['BOOKED', 'CANCELLED'],
  BOOKED: ['FINANCING_PENDING', 'READY_FOR_DELIVERY', 'CANCELLED'],
  FINANCING_PENDING: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface OrderTransitionGates {
  pdiComplete: boolean;
  agreementComplete: boolean;
  paymentComplete: boolean;
  registrationComplete: boolean;
  invoiceComplete: boolean;
  countersigned: boolean;
  paymentVerified: boolean;
  vehicleAllocated: boolean;
  deliveryHold: boolean;
}

// BR: "An order cannot be marked 'ready for delivery' until the PDI
// checklist is 100% complete", plus the agreement + payment gates before
// READY_FOR_DELIVERY, and the registration + invoice gates before DELIVERED
// (see backend's getTransitionBlockReason, the actual server-side authority
// — this only filters which transitions to *offer*).
export function getAllowedOrderTransitions(currentStatus: string, gates: OrderTransitionGates): string[] {
  const transitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];
  return transitions.filter((to) => {
    if (to === 'READY_FOR_DELIVERY') {
      return (
        gates.pdiComplete &&
        gates.agreementComplete &&
        gates.countersigned &&
        gates.paymentComplete &&
        gates.paymentVerified &&
        gates.vehicleAllocated &&
        !gates.deliveryHold
      );
    }
    if (to === 'DELIVERED') {
      return gates.registrationComplete && gates.invoiceComplete;
    }
    return true;
  });
}

// The backend's PATCH /api/orders/:id/financing-status accepts a move to any
// valid FinancingStatus (see VALID_FINANCING_STATUSES in orders.routes.ts) —
// no server-side sequencing is enforced, so this offers every other status
// rather than guessing at an unenforced lifecycle order.
export function getAllowedFinancingTransitions(currentStatus: string): string[] {
  return Object.keys(FINANCING_STATUS_LABELS).filter((s) => s !== currentStatus);
}
