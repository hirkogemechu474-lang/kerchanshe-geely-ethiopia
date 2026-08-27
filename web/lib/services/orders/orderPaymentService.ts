import { salesOrderRepository } from '@/repositories/salesOrderRepository';

export type OrderPaymentSummaryResult =
  | { ok: true; order: { id: string; orderNo: string; customerName: string; vehicleModel: string; totalPrice: number | null; paymentStatus: string; paymentProofUrl: string | null } }
  | { ok: false; httpStatus: 404 | 409; error: string };

// Public order/payment summary for the self-service payment page — same
// "order id as access token" pattern as /api/agreement/[orderId]. Only
// usable once a sales manager has countersigned.
export async function getOrderPaymentSummary(orderId: string): Promise<OrderPaymentSummaryResult> {
  const order = await salesOrderRepository.findById(orderId);
  if (!order) {
    return { ok: false, httpStatus: 404, error: 'Order not found' };
  }
  if (!order.countersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This order is not yet ready for payment.' };
  }

  return {
    ok: true,
    order: {
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      vehicleModel: order.vehicleModel,
      totalPrice: order.totalPrice,
      paymentStatus: order.paymentStatus,
      paymentProofUrl: order.paymentProofUrl,
    },
  };
}

export type MockPayResult =
  | { ok: true; paymentStatus: string; paymentConfirmedAt: Date }
  | { ok: false; httpStatus: 404 | 409; error: string };

// "Pay Online" mock — no real payment gateway exists yet (see the older
// web/app/api/payments/[paymentId]/authorize/route.ts, a Message-based
// mock this order-native flow deliberately doesn't reuse). Skips straight
// to PAID with no staff review, since a real gateway would confirm the
// charge itself.
export async function mockPayOrder(orderId: string): Promise<MockPayResult> {
  const order = await salesOrderRepository.findById(orderId);
  if (!order) {
    return { ok: false, httpStatus: 404, error: 'Order not found' };
  }
  if (!order.countersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This order is not yet ready for payment.' };
  }
  if (order.paymentStatus !== 'UNPAID') {
    return { ok: false, httpStatus: 409, error: 'A payment has already been submitted for this order.' };
  }

  const updated = await salesOrderRepository.updatePaymentStatusPaid(orderId);

  return { ok: true, paymentStatus: updated.paymentStatus, paymentConfirmedAt: updated.paymentConfirmedAt! };
}

export type SubmitPaymentProofResult =
  | { ok: true; paymentStatus: string; paymentProofUrl: string }
  | { ok: false; httpStatus: 400 | 404 | 409; error: string };

// Customer submits a bank-transfer receipt (uploaded via
// /api/upload/document first) — moves the order to PENDING_REVIEW for
// staff to confirm/reject (see admin/app/api/admin/orders/[id]/payment/confirm).
export async function submitPaymentProof(orderId: string, proofUrl: unknown): Promise<SubmitPaymentProofResult> {
  if (typeof proofUrl !== 'string' || !proofUrl.startsWith('/uploads/')) {
    return { ok: false, httpStatus: 400, error: 'A valid proofUrl is required.' };
  }

  const order = await salesOrderRepository.findById(orderId);
  if (!order) {
    return { ok: false, httpStatus: 404, error: 'Order not found' };
  }
  if (!order.countersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This order is not yet ready for payment.' };
  }
  if (order.paymentStatus !== 'UNPAID') {
    return { ok: false, httpStatus: 409, error: 'A payment has already been submitted for this order.' };
  }

  const updated = await salesOrderRepository.updatePaymentProof(orderId, proofUrl);

  return { ok: true, paymentStatus: updated.paymentStatus, paymentProofUrl: updated.paymentProofUrl! };
}
