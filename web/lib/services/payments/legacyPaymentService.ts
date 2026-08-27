import nodemailer from 'nodemailer';
import { messageRepository } from '@/repositories/messageRepository';
import { quotationRepository } from '@/repositories/quotationRepository';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';

// Legacy Message-as-ledger mock payment system: Vehicle Purchase / Vehicle
// Payment rows carry structured data encoded as text lines in
// Message.content. Deliberately not reused by the newer order-native flow
// (public/orders/[orderId]/payment/*) — see that route's own comment.
export const value = (content: string, label: string) =>
  content.split('\n').find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || '';

export function paymentResponse(id: string, content: string) {
  const paymentId = value(content, 'Payment ID');
  return {
    paymentId,
    purchaseId: value(content, 'Purchase ID'),
    paymentReference: value(content, 'Payment reference'),
    amount: value(content, 'Amount'),
    currency: 'ETB',
    bank: value(content, 'Bank'),
    vehicle: value(content, 'Vehicle'),
    status: value(content, 'Payment status'),
    paymentUrl: `/payment/mock/${paymentId}`,
    recordId: id,
  };
}

export type InitiatePaymentResult =
  | { ok: true; payment: ReturnType<typeof paymentResponse>; created: boolean }
  | { ok: false; httpStatus: 400 | 403 | 404 | 409; error: string };

export async function initiatePayment(purchaseId: string): Promise<InitiatePaymentResult> {
  const purchase = await messageRepository.findByCategoryAndSubject('Vehicle Purchase', `Vehicle Purchase - ${purchaseId}`);
  if (!purchase) return { ok: false, httpStatus: 404, error: 'Purchase not found.' };

  const purchaseStatus = value(purchase.content, 'Payment status');
  if (purchaseStatus === 'PAID') return { ok: false, httpStatus: 409, error: 'This purchase has already been paid.' };

  // Payment cannot start until a sales agent has approved the resulting
  // order (see docs/SWMS-INTEGRATION-BACKLOG.md Phase 16) — enforced here
  // server-side, not just by hiding the "Continue to Bank Payment" button,
  // so it can't be bypassed by calling this route directly. The purchase
  // Message and its SalesOrder aren't linked by a structured FK (Message
  // has no such field), so this looks them up the same way the rest of
  // this pipeline already correlates records: matching the purchase
  // reference embedded in the Quotation's own message text.
  const linkedQuotation = await quotationRepository.findFirstByMessageContainsWithSalesOrder(`Purchase reference: ${purchaseId}`);
  if (!linkedQuotation?.salesOrder?.approvedAt) {
    return {
      ok: false,
      httpStatus: 403,
      error: "This order is pending sales approval. You'll receive an email to review and sign your agreement once it's approved — payment can proceed after that.",
    };
  }

  const existing = await messageRepository.findLatestByCategoryAndContentContains('Vehicle Payment', `Purchase ID: ${purchaseId}`);
  if (existing && value(existing.content, 'Payment status') === 'PENDING') {
    return { ok: true, payment: paymentResponse(existing.id, existing.content), created: false };
  }

  const paymentId = `PAY-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
  const bank = value(purchase.content, 'Bank');
  const paymentContent = [
    `Payment ID: ${paymentId}`,
    `Purchase ID: ${purchaseId}`,
    `Payment reference: ${value(purchase.content, 'Payment reference') || purchaseId}`,
    `Customer: ${purchase.from}`,
    `Vehicle: ${value(purchase.content, 'Vehicle')}`,
    `Amount: ${value(purchase.content, 'Purchase amount')}`,
    `Bank: ${bank}`,
    `Currency: ETB`,
    `Payment status: PENDING`,
    `Transaction ID: PENDING`,
    `Purchase status: Payment Pending`,
  ].join('\n');
  const payment = await messageRepository.create({
    from: purchase.from,
    email: purchase.email,
    subject: `Vehicle Payment - ${paymentId}`,
    category: 'Vehicle Payment',
    priority: 'high',
    status: 'unread',
    content: paymentContent,
  });

  return { ok: true, payment: paymentResponse(payment.id, payment.content), created: true };
}

export type GetPaymentResult =
  | { ok: true; payment: ReturnType<typeof legacyPaymentSummary> }
  | { ok: false; httpStatus: 404; error: string };

function legacyPaymentSummary(paymentId: string, content: string) {
  return {
    paymentId,
    purchaseId: value(content, 'Purchase ID'),
    paymentReference: value(content, 'Payment reference'),
    vehicle: value(content, 'Vehicle'),
    amount: value(content, 'Amount'),
    bank: value(content, 'Bank'),
    status: value(content, 'Payment status'),
  };
}

export async function getPayment(paymentId: string): Promise<GetPaymentResult> {
  const payment = await messageRepository.findByCategoryAndSubject('Vehicle Payment', `Vehicle Payment - ${paymentId}`);
  if (!payment) return { ok: false, httpStatus: 404, error: 'Payment session not found.' };
  return { ok: true, payment: legacyPaymentSummary(paymentId, payment.content) };
}

export type AuthorizePaymentResult =
  | { ok: true; success: boolean; status: string; transactionId: string; paymentReference: string; amount?: string; currency?: string }
  | { ok: false; httpStatus: 404; error: string };

export async function authorizePayment(paymentId: string, action: string | undefined): Promise<AuthorizePaymentResult> {
  const payment = await messageRepository.findByCategoryAndSubject('Vehicle Payment', `Vehicle Payment - ${paymentId}`);
  if (!payment) return { ok: false, httpStatus: 404, error: 'Payment session not found.' };

  const currentStatus = value(payment.content, 'Payment status');
  if (currentStatus === 'PAID') {
    return {
      ok: true,
      success: true,
      status: 'PAID',
      transactionId: value(payment.content, 'Transaction ID'),
      paymentReference: value(payment.content, 'Payment reference'),
    };
  }

  const status = action === 'cancel' ? 'CANCELLED' : action === 'fail' ? 'FAILED' : 'PAID';
  const transactionId = status === 'PAID' ? `MOCK-${value(payment.content, 'Bank').replace(/[^A-Za-z]/g, '').slice(0, 8).toUpperCase() || 'BANK'}-${new Date().getTime()}` : `CANCELLED-${paymentId}`;
  const purchaseId = value(payment.content, 'Purchase ID');
  const updatedPaymentContent = payment.content.replace(/Payment status: \w+/, `Payment status: ${status}`).replace(/Transaction ID: [^\n]+/, `Transaction ID: ${transactionId}`).replace(/Purchase status: [^\n]+/, `Purchase status: ${status === 'PAID' ? 'Payment Confirmed' : 'Payment Pending'}`) + `\nCompleted at: ${new Date().toISOString()}`;
  await messageRepository.update(payment.id, { content: updatedPaymentContent, status: status === 'PAID' ? 'new' : 'unread' });

  const purchase = await messageRepository.findByCategoryAndSubject('Vehicle Purchase', `Vehicle Purchase - ${purchaseId}`);
  if (purchase) {
    const updatedPurchaseContent = purchase.content.replace(/Payment status: \w+/, `Payment status: ${status}`).replace(/Purchase status: [^\n]+/, `Purchase status: ${status === 'PAID' ? 'Payment Confirmed' : 'Payment Pending'}`).replace(/Transaction ID: [^\n]+/, `Transaction ID: ${transactionId}`);
    await messageRepository.update(purchase.id, { content: updatedPurchaseContent, status: status === 'PAID' ? 'new' : 'unread' });
    if (status === 'PAID') {
      await messageRepository.create({
        from: 'Payment System',
        email: purchase.email,
        subject: 'New Vehicle Purchase Payment',
        category: 'Admin Notification',
        priority: 'high',
        status: 'unread',
        content: `Customer: ${purchase.from}\nVehicle: ${value(purchase.content, 'Vehicle')}\nAmount: ${value(purchase.content, 'Purchase amount')}\nBank: ${value(purchase.content, 'Bank')}\nTransaction: ${transactionId}\nStatus: PAID\nPurchase ID: ${purchaseId}`,
      });
      await sendPaymentEmails(purchase, updatedPurchaseContent, transactionId, purchaseId);

      // Surface the paid status on the linked SalesOrder itself — the
      // sales agent otherwise has no way to see payment completed short
      // of digging through the raw Messages inbox. financingStatus is
      // already used generically for a direct (non-loan) purchase's
      // "money side is resolved" signal (see linkPurchaseToSalesPipeline,
      // which seeds it as PENDING regardless of whether the order is
      // actually financed), so APPROVED here means the same thing: the
      // customer has paid and the order can proceed.
      const linkedQuotation = await quotationRepository.findFirstByMessageContainsWithSalesOrder(`Purchase reference: ${purchaseId}`);
      if (linkedQuotation?.salesOrder && linkedQuotation.salesOrder.financingStatus !== 'APPROVED') {
        await salesOrderRepository.updateFinancingStatus(linkedQuotation.salesOrder.id, 'APPROVED');
      }
    }
  }

  return {
    ok: true,
    success: status === 'PAID',
    status,
    transactionId,
    paymentReference: value(payment.content, 'Payment reference'),
    amount: value(payment.content, 'Amount'),
    currency: 'ETB',
  };
}

async function sendPaymentEmails(purchase: { from: string; email: string; content: string }, content: string, transactionId: string, purchaseId: string) {
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) return;
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  const details = `Customer: ${purchase.from}\nEmail: ${purchase.email}\n${content}\nTransaction ID: ${transactionId}\nPurchase ID: ${purchaseId}`;
  await transporter.sendMail({ from, to: process.env.ADMIN_EMAIL, replyTo: purchase.email, subject: 'New Geely Vehicle Purchase Payment Confirmed', text: details });
  await transporter.sendMail({ from, to: purchase.email, subject: 'Your Geely Payment Has Been Confirmed', text: `Hello ${purchase.from},\n\nYour Geely payment has been successfully received.\n\n${details}\n\nOur sales team will contact you regarding delivery.` });
}
