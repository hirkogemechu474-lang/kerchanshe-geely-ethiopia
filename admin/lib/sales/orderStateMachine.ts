import type { OrderStatus } from '@prisma/client';

// Sales Order lifecycle (BRD §6.1 FR-105/106, UC-12 Book Order & PDI).
// Mirrors the same pattern as lib/workshop/jobCardStateMachine.ts: a single
// source of truth for valid transitions and their business-rule guards,
// used by both the status API route and the admin UI (to disable invalid
// buttons) so the rules can't drift between frontend and backend.
const FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  QUOTED: ['BOOKED', 'CANCELLED'],
  BOOKED: ['FINANCING_PENDING', 'READY_FOR_DELIVERY', 'CANCELLED'],
  FINANCING_PENDING: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export interface OrderTransitionContext {
  pdiComplete: boolean;
  // Approved by a sales agent AND the signed agreement has been attached —
  // see admin/app/api/admin/orders/[id]/approve and .../agreement.
  agreementComplete: boolean;
}

export class OrderTransitionError extends Error {}

export function getAllowedOrderTransitions(status: OrderStatus, ctx: OrderTransitionContext): OrderStatus[] {
  return FORWARD_TRANSITIONS[status].filter((next) => {
    try {
      assertOrderTransitionAllowed(status, next, ctx);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * BR (FR-106): "An order cannot be marked 'ready for delivery' until the
 * PDI checklist is 100% complete." Guarded here, not just in the UI, so it
 * can never be bypassed by calling the API directly.
 */
export function assertOrderTransitionAllowed(from: OrderStatus, to: OrderStatus, ctx: OrderTransitionContext): void {
  if (from === to) {
    throw new OrderTransitionError('Order is already in this status.');
  }

  if (!FORWARD_TRANSITIONS[from].includes(to)) {
    throw new OrderTransitionError(`Cannot move an order from ${from} to ${to}.`);
  }

  if (to === 'READY_FOR_DELIVERY' && !ctx.pdiComplete) {
    throw new OrderTransitionError('Cannot mark ready for delivery until every PDI checklist item is complete.');
  }

  if (to === 'READY_FOR_DELIVERY' && !ctx.agreementComplete) {
    throw new OrderTransitionError('Cannot mark ready for delivery until the order is approved and the signed agreement is attached.');
  }
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  QUOTED: 'Quoted',
  BOOKED: 'Booked',
  FINANCING_PENDING: 'Financing Pending',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  QUOTED: 'bg-gray-100 text-gray-700',
  BOOKED: 'bg-blue-100 text-blue-700',
  FINANCING_PENDING: 'bg-orange-100 text-orange-700',
  READY_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const FINANCING_STATUS_LABELS: Record<string, string> = {
  NOT_APPLICABLE: 'Not applicable',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
};
