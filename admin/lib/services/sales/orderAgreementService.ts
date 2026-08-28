import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { userRepository } from '@/repositories/userRepository';
import { buildSalesAgreementPdf } from '@/lib/services/sales/salesAgreementPdf';
import { sendStatusEmail } from '@/lib/status-email';
import { env } from '@/lib/env';

export type OrderActionResult<T extends object = {}> =
  | ({ ok: true } & T)
  | { ok: false; httpStatus: 404 | 409; error: string };

/**
 * Renders the sales agreement as a real PDF for a booked order — staff can
 * view/download/print it, and the same PDF is attached to the approval
 * email. Generated fresh from live order data on every request (no
 * separate stored document) — it only becomes viewable once the order has
 * been approved.
 */
export async function getAgreementPdf(id: string): Promise<OrderActionResult<{ pdfBytes: Uint8Array; orderNo: string }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.approvedAt) {
    return { ok: false, httpStatus: 409, error: 'This order must be approved before the agreement can be viewed.' };
  }

  const pdfBytes = await buildSalesAgreementPdf(order);
  return { ok: true, pdfBytes, orderNo: order.orderNo };
}

// Sales-agent approval step: "Sales Quotation -> Approval by sales agent ->
// Generate Agreement -> e-sign/attach". Approving only finalizes
// approvedAt/approvedById — this is a deliberate draft/review step: the
// agreement PDF is not built or emailed here. Staff preview it and can
// still adjust the price before a separate, explicit action (sendAgreement)
// actually generates and emails it to the customer.
export async function approveOrder(id: string, actingUserId: string): Promise<OrderActionResult<{ order: any }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (order.approvedAt) return { ok: false, httpStatus: 409, error: 'This order is already approved' };

  const updated = await salesOrderRepository.update(id, { approvedAt: new Date(), approvedById: actingUserId });
  return { ok: true, order: updated };
}

// The second, explicit step of "Approve -> review/adjust price -> Send".
// Requires approvedAt to already be set (approveOrder deliberately no
// longer auto-sends). Builds the agreement PDF from current order data and
// emails it. Not a one-way lock like the invoice — callable again to resend
// a revised copy after a price adjustment, updating agreementSentAt each
// time.
export async function sendAgreement(id: string): Promise<OrderActionResult<{ order: any; notificationSent: boolean }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.approvedAt) {
    return { ok: false, httpStatus: 409, error: 'Approve this order before sending the agreement.' };
  }
  if (order.signedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'This agreement has already been signed and cannot be resent.' };
  }

  let notificationSent = false;
  if (order.customerEmail) {
    try {
      const siteUrl = env.app.url.replace(/\/$/, '');
      const signingUrl = `${siteUrl}/agreement/${order.id}`;
      const pdfBytes = await buildSalesAgreementPdf(order);
      notificationSent = await sendStatusEmail({
        to: order.customerEmail,
        name: order.customerName,
        entityType: 'sales order',
        status: 'approved',
        reference: order.orderNo,
        details: 'Your order has been approved! Your sales agreement is attached as a PDF — sign it online (draw a signature or upload a photo of a signed printout) to continue to payment.',
        actionUrl: signingUrl,
        actionLabel: 'Continue',
        attachments: [
          { filename: `${order.orderNo}-agreement.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' },
        ],
      });
    } catch (emailError) {
      console.error('[orders:send-agreement:email]', emailError);
    }
  }

  const updated = await salesOrderRepository.update(id, { agreementSentAt: new Date() });
  return { ok: true, order: updated, notificationSent };
}

// Manager countersign step — a second, staff-side sign-off after the
// customer has e-signed the agreement. Unlike the customer's signature,
// this doesn't capture a drawn image — just identity + timestamp, matching
// approvedAt/approvedById. Immediately emails the customer a payment link.
export async function countersignAgreement(id: string, actingUserId: string): Promise<OrderActionResult<{ order: any; notificationSent: boolean }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.signedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'The customer has not signed the agreement yet.' };
  }
  if (order.countersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This agreement has already been countersigned.' };
  }

  let notificationSent = false;
  if (order.customerEmail) {
    try {
      const siteUrl = env.app.url.replace(/\/$/, '');
      notificationSent = await sendStatusEmail({
        to: order.customerEmail,
        name: order.customerName,
        entityType: 'sales order',
        status: 'countersigned',
        reference: order.orderNo,
        details: 'Your signed agreement has been countersigned by our sales manager. Please complete payment to proceed with your order.',
        actionUrl: `${siteUrl}/payment/order/${order.id}`,
        actionLabel: 'Pay Now',
      });
    } catch (emailError) {
      console.error('[orders:countersign:email]', emailError);
    }
  }

  const updated = await salesOrderRepository.update(id, { countersignedAt: new Date(), countersignedById: actingUserId });

  // Stamps the manager's own on-file signature (or their typed name, if
  // they haven't set one up yet — see /admin/signatures) onto the "Sales
  // Agent Signature & Date" line of the already-saved signed PDF, which
  // lives on web's disk — best-effort, never blocks the countersign
  // itself on a network hiccup.
  try {
    const siteUrl = env.app.url.replace(/\/$/, '');
    await fetch(`${siteUrl}/api/agreement/${id}/countersign-stamp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: actingUserId }),
    });
  } catch (stampError) {
    console.error('[orders:countersign:stamp]', stampError);
  }

  return { ok: true, order: updated, notificationSent };
}

// "Return for Correction" alternative to countersignAgreement — same
// precondition (customer must have signed first), but returns the signed
// copy to the sales agent instead of approving it. Cleared implicitly the
// next time a signed copy is attached (see .../[id]/route.ts's
// signedDocumentUrl PATCH).
export async function rejectAgreement(id: string, actingUserId: string, reason: string): Promise<OrderActionResult<{ order: any }>> {
  const order = await salesOrderRepository.findById(id);
  if (!order) return { ok: false, httpStatus: 404, error: 'Order not found' };
  if (!order.signedDocumentUrl) {
    return { ok: false, httpStatus: 409, error: 'The customer has not signed the agreement yet.' };
  }
  if (order.countersignedAt) {
    return { ok: false, httpStatus: 409, error: 'This agreement has already been countersigned.' };
  }

  const updated = await salesOrderRepository.update(id, {
    rejectedAt: new Date(),
    rejectedById: actingUserId,
    rejectionReason: reason,
  });

  if (updated.salesAgentId) {
    try {
      const rep = await userRepository.findActiveSalesRepByName(updated.salesAgentId);
      if (rep?.email) {
        const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
        await sendStatusEmail({
          to: rep.email,
          name: rep.name,
          entityType: 'sales agreement',
          status: 'returned for correction',
          reference: updated.orderNo,
          details: `Reason: ${reason}`,
          actionUrl: adminUrl ? `${adminUrl.replace(/\/$/, '')}/admin/orders/${updated.id}` : undefined,
          actionLabel: 'Review Order',
        });
      }
    } catch (error) {
      console.error('[orders:reject-agreement:notify]', error);
    }
  }

  return { ok: true, order: updated };
}
