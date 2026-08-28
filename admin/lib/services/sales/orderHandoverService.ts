import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { buildHandoverPdf } from '@/lib/services/sales/handoverPdf';
import { buildSalesInvoicePdf } from '@/lib/services/sales/salesInvoicePdf';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

export type OrderActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; httpStatus: 404 | 409; error: string };

/**
 * The dual-signature counterpart to sendAgreement: emails the customer a
 * link to web/app/handover/[orderId], where they confirm receipt of the
 * vehicle before a manager countersigns via countersignHandover. Requires
 * the order to already be DELIVERED — this is a formal acknowledgement of
 * an already-completed handover, not a gate on marking it delivered in the
 * first place. Resendable, same convention as sendAgreement.
 */
export async function sendHandoverSignoff(id: string): Promise<OrderActionResult<{ notificationSent: boolean }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.deliveredAt) {
    return { ok: false, httpStatus: 409, error: 'Mark this order Delivered before sending the handover sign-off link.' };
  }
  if (order.handoverSignedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'This handover has already been signed and cannot be resent.' };
  }

  let notificationSent = false;
  if (order.customerEmail) {
    try {
      const siteUrl = env.app.url.replace(/\/$/, '');
      const signingUrl = `${siteUrl}/handover/${order.id}`;
      const pdfBytes = await buildHandoverPdf(order);
      notificationSent = await sendStatusEmail({
        to: order.customerEmail,
        name: order.customerName,
        entityType: 'vehicle handover',
        status: 'delivered',
        reference: order.orderNo,
        details: 'Please confirm receipt of your vehicle — sign the handover confirmation online (draw a signature or upload a photo of a signed printout).',
        actionUrl: signingUrl,
        actionLabel: 'Confirm Handover',
        attachments: [
          { filename: `${order.orderNo}-handover.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' },
        ],
      });
    } catch (emailError) {
      console.error('[orders:send-handover-signoff:email]', emailError);
    }
  }

  return { ok: true, notificationSent };
}

// Manager countersign step for the vehicle handover — the same authority
// and identity+timestamp-only shape as countersignAgreement, just closing
// out the later handover stage instead of the earlier agreement stage.
export async function countersignHandover(id: string, actingUserId: string): Promise<OrderActionResult<{ order: any }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.handoverSignedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'The customer has not signed the handover confirmation yet.' };
  }
  if (order.handoverCountersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This handover has already been countersigned.' };
  }

  const updated = await salesOrderRepository.update(id, {
    handoverCountersignedAt: new Date(),
    handoverCountersignedById: actingUserId,
  });

  // Stamps the manager's own on-file signature (or their typed name, if
  // they haven't set one up yet — see /admin/signatures) onto the "Geely
  // Ethiopia Representative & Date" line — best-effort, never blocks the
  // countersign itself on a network hiccup.
  try {
    const siteUrl = env.app.url.replace(/\/$/, '');
    await fetch(`${siteUrl}/api/handover/${id}/countersign-stamp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: actingUserId }),
    });
  } catch (stampError) {
    console.error('[orders:handover-countersign:stamp]', stampError);
  }

  return { ok: true, order: updated };
}

/**
 * Sends the "your vehicle has been delivered, thank you" confirmation with
 * the invoice PDF re-attached. A separate action from the DELIVERED status
 * transition itself, fired by the dedicated Handover panel right after that
 * transition succeeds. Not a one-way lock — callable again to resend,
 * updating handoverNotifiedAt.
 */
export async function sendHandoverEmail(id: string): Promise<OrderActionResult<{ order: any; notificationSent: boolean }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (order.status !== 'DELIVERED') {
    return { ok: false, httpStatus: 409, error: 'This order has not been marked delivered yet.' };
  }

  const updated = await salesOrderRepository.update(id, { handoverNotifiedAt: new Date() });

  let notificationSent = false;
  if (updated.customerEmail) {
    try {
      const attachments = [];
      if (updated.invoicedAt) {
        const pdfBytes = await buildSalesInvoicePdf(updated);
        attachments.push({ filename: `${updated.invoiceNo || updated.orderNo}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' });
      }
      notificationSent = await sendStatusEmail({
        to: updated.customerEmail,
        name: updated.customerName,
        entityType: 'sales order',
        status: 'delivered',
        reference: updated.orderNo,
        details: `Your ${updated.vehicleModel} has been delivered. Thank you for choosing Geely Ethiopia — your invoice/receipt is attached for your records.`,
        attachments,
      });
    } catch (emailError) {
      console.error('[orders:handover-email]', emailError);
    }
  }

  return { ok: true, order: updated, notificationSent };
}
