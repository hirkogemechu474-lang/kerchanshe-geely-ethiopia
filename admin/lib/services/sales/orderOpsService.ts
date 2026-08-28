import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { testDriveRepository } from '@/repositories/testDriveRepository';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { sendStatusEmail } from '@/lib/status-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { env } from '@/lib/env';
import { assertOrderTransitionAllowed, OrderTransitionError } from '@/lib/services/sales/orderStateMachine';
import type { OrderStatus } from '@prisma/client';

export type OrderActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; httpStatus: 404 | 409; error: string };

// Marks a commission as paid — a separate manual step from it being
// EARNED (which happens automatically on delivery, see transitionOrderStatus).
// Accounting pays the agent on their own schedule, so this is never
// automatic.
export async function payCommission(id: string): Promise<OrderActionResult<{ order: any }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (order.commissionStatus !== 'EARNED') {
    return { ok: false, httpStatus: 409, error: 'Commission must be earned (order delivered) before it can be marked paid.' };
  }

  const updated = await salesOrderRepository.update(id, { commissionStatus: 'PAID' });
  return { ok: true, order: updated };
}

// Staff review of a customer-submitted bank-transfer proof. Only
// meaningful while paymentStatus is PENDING_REVIEW — nothing to confirm or
// reject otherwise. `reject` clears the proof so the customer can
// re-submit cleanly rather than keeping a rejected file around.
export async function confirmPayment(id: string, action: 'confirm' | 'reject', actingUserId: string): Promise<OrderActionResult<{ order: any }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (order.paymentStatus !== 'PENDING_REVIEW') {
    return { ok: false, httpStatus: 409, error: 'No pending payment submission to review.' };
  }

  const updated = await salesOrderRepository.update(
    id,
    action === 'confirm'
      ? { paymentStatus: 'PAID', paymentConfirmedAt: new Date(), paymentConfirmedById: actingUserId }
      : { paymentStatus: 'UNPAID', paymentProofUrl: null }
  );

  return { ok: true, order: updated };
}

// Toggle a single PDI checklist item (BRD API design: PATCH /api/orders/{id}/pdi).
export async function togglePdiItem(orderId: string, itemId: string, isChecked: boolean, actingUserId: string): Promise<OrderActionResult<{ item: any }>> {
  const item = await salesOrderRepository.findPdiItem(itemId, orderId);
  if (!item) return { ok: false, httpStatus: 404, error: 'Checklist item not found on this order' };

  const updated = await salesOrderRepository.updatePdiItem(
    itemId,
    isChecked
      ? { isChecked: true, checkedById: actingUserId, checkedAt: new Date() }
      : { isChecked: false, checkedById: null, checkedAt: null }
  );

  return { ok: true, item: updated };
}

/**
 * Sales-agent-initiated test drive tied to a specific order — distinct from
 * the standalone public /test-drive booking flow. Creates a real TestDrive
 * row (salesOrderId set) with its own reference and emails the customer a
 * link to web/app/test-drive/confirm/[id], where they confirm they'll be
 * there.
 */
export async function sendTestDriveInvite(
  orderId: string,
  input: { preferredDate: string; preferredTime: string; location: string }
): Promise<OrderActionResult<{ testDrive: any; notificationSent: boolean }>> {
  const parsedDate = new Date(`${input.preferredDate}T00:00:00`);

  const order = await salesOrderRepository.findById(orderId);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.customerEmail) {
    return { ok: false, httpStatus: 409, error: 'This order has no customer email on file — add one before sending a test-drive invite.' };
  }

  // Best-effort match, same convention as web/app/api/agreement/[orderId]/route.ts
  // — SalesOrder.vehicleModel is a plain string, not an FK.
  const vehicle = await vehicleRepository.findPublishedIdByName(order.vehicleModel);
  if (!vehicle) {
    return {
      ok: false,
      httpStatus: 409,
      error: `Could not find "${order.vehicleModel}" in the published vehicle catalog to link the test drive to.`,
    };
  }

  const reference = await generateReference(REFERENCE_CATEGORY.TEST_DRIVE);
  const testDrive = await testDriveRepository.create({
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    vehicle: { connect: { id: vehicle.id } },
    preferredDate: parsedDate,
    preferredTime: input.preferredTime,
    location: input.location,
    salesOrder: { connect: { id: order.id } },
    salesRepId: order.salesAgentId,
    status: 'pending',
    reference,
  });

  let notificationSent = false;
  try {
    const siteUrl = env.app.url.replace(/\/$/, '');
    notificationSent = await sendStatusEmail({
      to: order.customerEmail,
      name: order.customerName,
      entityType: 'test drive',
      status: 'requested',
      reference,
      details: `Your sales consultant has arranged a test drive for your ${order.vehicleModel} on ${input.preferredDate} at ${input.preferredTime}, at ${input.location}. Please bring a valid driver's license.`,
      actionUrl: `${siteUrl}/test-drive/confirm/${testDrive.id}`,
      actionLabel: 'Confirm Test Drive',
    });
  } catch (emailError) {
    console.error('[orders:send-test-drive:email]', emailError);
  }

  return { ok: true, testDrive, notificationSent };
}

export async function transitionOrderStatus(
  id: string,
  toStatus: OrderStatus,
  reasonCode: string | undefined,
  actingUserId: string
): Promise<OrderActionResult<{ order: any }>> {
  const order = await salesOrderRepository.findByIdWithPdiItems(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };

  const pdiComplete = order.pdiItems.length > 0 && order.pdiItems.every((p) => p.isChecked);
  const agreementComplete = Boolean(order.approvedAt) && Boolean(order.signedDocumentUrl);
  const paymentComplete = order.paymentStatus === 'PAID';
  const registrationComplete = Boolean(order.registeredAt);
  const invoiceComplete = Boolean(order.invoicedAt);

  try {
    assertOrderTransitionAllowed(order.status, toStatus, { pdiComplete, agreementComplete, paymentComplete, registrationComplete, invoiceComplete });
  } catch (err) {
    if (err instanceof OrderTransitionError) {
      return { ok: false, httpStatus: 409, error: err.message };
    }
    throw err;
  }

  // Commission is earned automatically the moment an order is delivered —
  // a consequence of delivery, not a prerequisite for it, so this doesn't
  // participate in the transition gate above. Only computed if a sales
  // agent is actually on file; nothing changes for orders with none.
  const earnsCommissionNow =
    toStatus === 'DELIVERED' && Boolean(order.salesAgentId) && order.commissionStatus !== 'PAID';
  const commissionAmount = earnsCommissionNow
    ? (order.totalPrice ?? 0) * ((order.commissionRate ?? 0) / 100)
    : undefined;

  const updated = await salesOrderRepository.transitionStatus(
    id,
    {
      status: toStatus,
      ...(toStatus === 'DELIVERED' && { deliveredAt: new Date() }),
      ...(earnsCommissionNow && { commissionStatus: 'EARNED', commissionAmount }),
    },
    { fromStatus: order.status, toStatus, changedById: actingUserId, reasonCode: reasonCode || null }
  );

  return { ok: true, order: updated };
}
