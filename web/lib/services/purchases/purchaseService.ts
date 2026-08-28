import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { messageRepository } from '@/repositories/messageRepository';
import { quotationRepository } from '@/repositories/quotationRepository';
import { salesOrderRepository } from '@/repositories/salesOrderRepository';
import { showroomVisitRepository } from '@/repositories/showroomVisitRepository';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { financingRepository } from '@/repositories/financingRepository';
import { PDI_CHECKLIST_TEMPLATE } from '@/lib/services/sales/pdiChecklistTemplate';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';
import { value } from '@/lib/services/payments/legacyPaymentService';
import { env } from '@/lib/env';

// Most mail clients (Gmail included) won't fetch an <img src> pointing at
// http://localhost, and many block remote images by default even when the
// URL is public — so the logo is attached inline via cid instead of linked.
function readLogoBytes(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), 'public', 'assets', 'logos', 'geely-logo.png'));
  } catch {
    return null;
  }
}

export type PurchaseRequest = {
  fullName?: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  color?: string;
  quantity?: number;
  address?: string;
  bankId?: string;
  vehicleId?: string;
  consent?: boolean;
  // Carries either a real Quotation id (customer got a quote first, then
  // continued to payment) or the "qr-visit-<id>" sentinel used only to
  // bypass the UI's "request a quote first" gate — see web/app/quote/page.tsx
  // and web/app/visit/options/page.tsx.
  quoteReference?: string;
  // Showroom QR walk-in flow: links this purchase back to the visitor's
  // ShowroomVisit session.
  visitId?: string;
};

// Connects a direct vehicle purchase into the same Quotation -> SalesOrder
// pipeline admin's "Convert to Order" action creates, so a QR-showroom (or
// any) purchase shows up in the Orders/PDI pipeline instead of only existing
// as a Message. Reuses an existing Quotation when one already exists for
// this purchase (the customer got a quote first, then continued to
// payment) rather than creating a duplicate lead for the same intent.
async function linkPurchaseToSalesPipeline(details: {
  fullName: string;
  phone: string;
  email: string;
  vehicleName: string;
  color: string;
  quantity: number;
  bankName: string;
  purchaseAmount: number;
  purchaseReference: string;
  quoteReference?: string;
  visitId?: string;
}): Promise<{ approved: boolean }> {
  const configurationJson = {
    vehicle: details.vehicleName,
    color: details.color || null,
    quantity: details.quantity,
    bank: details.bankName,
  };

  let quotation = null;
  if (details.quoteReference && !details.quoteReference.startsWith('qr-visit-')) {
    quotation = await quotationRepository.findByIdWithSalesOrder(details.quoteReference).catch(() => null);
    // Every downstream lookup (payment-approval gate, confirmation-screen
    // status check) correlates purely by searching a Quotation's message
    // text for "Purchase reference: <id>" — see /api/payments/initiate and
    // /api/public/purchases/[purchaseId]. A reused quotation only ever got
    // that text at ITS OWN creation (for whatever the original quote
    // request was), never for this new purchase, so without appending it
    // here every one of those lookups would silently fail to find this
    // purchase's SalesOrder forever, even though it's created correctly
    // below.
    if (quotation && !quotation.message?.includes(`Purchase reference: ${details.purchaseReference}`)) {
      quotation = await quotationRepository.updateMessage(
        quotation.id,
        `${quotation.message ? `${quotation.message}\n` : ''}Purchase reference: ${details.purchaseReference}`
      );
    }
  }

  if (!quotation) {
    quotation = await quotationRepository.createWithSalesOrder({
      customerName: details.fullName,
      phoneNumber: details.phone,
      email: details.email,
      vehicleModel: details.vehicleName,
      financingInterest: true,
      message: `Direct vehicle purchase — ${details.quantity}x, color: ${details.color || 'Not specified'}, bank: ${details.bankName}. Purchase reference: ${details.purchaseReference}`,
      configurationJson,
      source: details.visitId ? 'qr-showroom' : 'website',
      status: 'new',
    });
  }

  let salesOrder = quotation.salesOrder;
  if (!salesOrder) {
    const orderNo = await salesOrderRepository.nextOrderNo();
    salesOrder = await salesOrderRepository.create({
      orderNo,
      quotation: { connect: { id: quotation.id } },
      customerName: details.fullName,
      customerPhone: details.phone,
      customerEmail: details.email,
      vehicleModel: details.vehicleName,
      configurationJson: quotation.configurationJson ?? undefined,
      totalPrice: details.purchaseAmount,
      financingStatus: 'REQUESTED',
      status: 'BOOKED',
      statusHistory: {
        create: { fromStatus: null, toStatus: 'BOOKED', changedById: 'qr-showroom-direct-purchase' },
      },
      pdiItems: { create: PDI_CHECKLIST_TEMPLATE.map((label) => ({ label })) },
    });
    if (quotation.status !== 'converted') {
      await quotationRepository.updateStatus(quotation.id, 'converted');
    }
  }

  if (details.visitId) {
    await showroomVisitRepository.linkQuotationAndOrder(details.visitId, quotation.id, salesOrder.id).catch(() => {});
  }

  return { approved: Boolean(salesOrder.approvedAt) };
}

export type SubmitPurchaseResult =
  | {
      ok: true;
      purchase: {
        purchaseId: string;
        transactionId: string;
        paymentReference: string;
        paymentDate: string;
        status: string;
        checkoutUrl: string | null;
        approved: boolean;
      };
    }
  | { ok: false; httpStatus: 400 | 404; error: string };

export async function submitPurchase(body: PurchaseRequest): Promise<SubmitPurchaseResult> {
  const fullName = String(body.fullName || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const nationalId = String(body.nationalId || '').trim();
  const address = String(body.address || '').trim();
  const vehicleId = String(body.vehicleId || '').trim();
  const bankId = String(body.bankId || '').trim();
  const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 0));

  if (!fullName || !phone || !nationalId || !address || !vehicleId || !bankId || !body.consent || quantity < 1) {
    return { ok: false, httpStatus: 400, error: 'Please complete all required purchase details.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, httpStatus: 400, error: 'A valid email address is required.' };
  }

  const [vehicle, bank] = await Promise.all([
    vehicleRepository.findActivePublishedForPurchase(vehicleId),
    financingRepository.findActiveBank(bankId),
  ]);

  if (!vehicle) return { ok: false, httpStatus: 404, error: 'Vehicle is no longer available.' };
  if (!bank) return { ok: false, httpStatus: 400, error: 'Selected bank is not available.' };

  const supportedProgram = await financingRepository.findPublishedProgramForBankAndVehicle(bankId, vehicleId);
  if (!supportedProgram) {
    return { ok: false, httpStatus: 400, error: 'This bank does not currently support the selected vehicle.' };
  }

  const purchaseAmount = (vehicle.finalPrice ?? vehicle.basePrice) * quantity;
  const purchaseReference = await generateReference(REFERENCE_CATEGORY.PURCHASE);
  const transactionId = 'PENDING';

  // Payment remains pending until the selected provider confirms it through the callback route.
  // Sandbox callbacks can be enabled explicitly with PAYMENT_MODE=sandbox.
  const paymentStatus: string = 'PENDING';
  const purchaseStatus = paymentStatus === 'PAID' ? 'Payment Confirmed' : 'Payment Pending';
  const content = [
    `Purchase ID: ${purchaseReference}`,
    `Customer: ${fullName}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `National ID / Passport: ${nationalId}`,
    `Vehicle: ${vehicle.name} (${vehicle.id})`,
    `Quantity: ${quantity}`,
    `Preferred color: ${String(body.color || 'Not specified')}`,
    `Purchase amount: ETB ${purchaseAmount.toLocaleString('en-US')}`,
    `Bank: ${bank.name}`,
    `Payment method: Bank online payment`,
    `Payment status: ${paymentStatus}`,
    `Purchase status: ${purchaseStatus}`,
    `Transaction ID: ${transactionId}`,
    `Payment reference: ${purchaseReference}`,
    `Address: ${address}`,
  ].join('\n');

  const record = await messageRepository.create({
    from: fullName,
    email,
    subject: `Vehicle Purchase - ${purchaseReference}`,
    category: 'Vehicle Purchase',
    priority: 'high',
    status: paymentStatus === 'PAID' ? 'new' : 'unread',
    content,
    reference: purchaseReference,
  });

  void sendPurchaseEmail({ fullName, email, vehicleName: vehicle.name, bankName: bank.name, purchaseAmount, purchaseReference, transactionId, recordId: record.id, paymentStatus });

  // Until a sales agent approves the resulting order and the customer
  // signs the agreement (see docs/SWMS-INTEGRATION-BACKLOG.md Phase 16),
  // payment must not proceed — /api/payments/initiate enforces this
  // server-side too, but surfacing it here lets the confirmation screen
  // show the right message instead of a dead-end "Pay Now" button.
  let approved = false;
  try {
    const pipelineResult = await linkPurchaseToSalesPipeline({
      fullName,
      phone,
      email,
      vehicleName: vehicle.name,
      color: String(body.color || ''),
      quantity,
      bankName: bank.name,
      purchaseAmount,
      purchaseReference,
      quoteReference: typeof body.quoteReference === 'string' ? body.quoteReference.trim() : undefined,
      visitId: typeof body.visitId === 'string' && body.visitId ? body.visitId : undefined,
    });
    approved = pipelineResult.approved;
  } catch (pipelineError) {
    console.error('[public:purchases:sales-pipeline]', pipelineError);
  }

  return {
    ok: true,
    purchase: {
      purchaseId: purchaseReference,
      transactionId,
      paymentReference: purchaseReference,
      paymentDate: new Date().toISOString(),
      status: paymentStatus,
      checkoutUrl: supportedProgram.directPayUrl || bank.websiteUrl || null,
      approved,
    },
  };
}

async function sendPurchaseEmail(details: { fullName: string; email: string; vehicleName: string; bankName: string; purchaseAmount: number; purchaseReference: string; transactionId: string; recordId: string; paymentStatus: string }) {
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  try {
    await transporter.sendMail({
      from,
      to: process.env.ADMIN_EMAIL,
      replyTo: details.email,
      subject: `New Vehicle Purchase - ${details.purchaseReference}`,
      text: `New vehicle purchase request\n\nCustomer: ${details.fullName}\nEmail: ${details.email}\nVehicle: ${details.vehicleName}\nAmount: ETB ${details.purchaseAmount.toLocaleString('en-US')}\nBank: ${details.bankName}\nPayment status: ${details.paymentStatus}\nPurchase reference: ${details.purchaseReference}\nTransaction ID: ${details.transactionId}\nInternal record: ${details.recordId}`,
    });

    // The customer's only way back to this purchase (short of the later
    // approval email) — the confirmation screen otherwise only lives in
    // that page's local state and is lost the moment the tab closes.
    const siteUrl = env.app.url.replace(/\/$/, '');
    const continueUrl = `${siteUrl}/financing/apply?purchaseId=${encodeURIComponent(details.purchaseReference)}`;
    const statusUrl = `${siteUrl}/status?ref=${encodeURIComponent(details.purchaseReference)}`;
    const logoHtml = `<div style="text-align:center;padding:24px 0;"><img src="cid:geely-logo" alt="Geely" style="height:56px;" /></div>`;
    const statusButtonHtml = `<div style="text-align:center;margin:28px 0;"><a href="${statusUrl}" style="background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;display:inline-block;">Check Your Status</a></div>`;
    const logoBytes = readLogoBytes();
    const logoAttachments = logoBytes ? [{ filename: 'geely-logo.png', content: logoBytes, cid: 'geely-logo' }] : undefined;

    if (details.paymentStatus === 'PAID') {
      await transporter.sendMail({
        from,
        to: details.email,
        subject: 'Geely Ethiopia Purchase Confirmation',
        text: `Dear ${details.fullName},\n\nYour purchase of ${details.vehicleName} has been confirmed.\nAmount: ETB ${details.purchaseAmount.toLocaleString('en-US')}\nBank: ${details.bankName}\nPurchase reference: ${details.purchaseReference}\nTransaction ID: ${details.transactionId}\n\nCheck your status: ${statusUrl}\n\nOur sales team will contact you about delivery.`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">${logoHtml}<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;"><h2 style="margin-top:0;">Dear ${details.fullName},</h2><p>Your purchase of ${details.vehicleName} has been confirmed.</p><p><strong>Amount:</strong> ETB ${details.purchaseAmount.toLocaleString('en-US')}<br /><strong>Bank:</strong> ${details.bankName}<br /><strong>Purchase reference:</strong> ${details.purchaseReference}<br /><strong>Transaction ID:</strong> ${details.transactionId}</p>${statusButtonHtml}<p>Our sales team will contact you about delivery.</p></div></div>`,
        attachments: logoAttachments,
      });
    } else {
      await transporter.sendMail({
        from,
        to: details.email,
        subject: `Geely Ethiopia — Purchase Received (${details.purchaseReference})`,
        text: `Dear ${details.fullName},\n\nThank you. We received your purchase request for ${details.vehicleName}.\nAmount: ETB ${details.purchaseAmount.toLocaleString('en-US')}\nBank: ${details.bankName}\nPurchase reference: ${details.purchaseReference}\n\nYour order is pending approval by a sales agent. Once approved, we'll email you a sales agreement to review and sign, and you'll be able to continue to payment.\n\nContinue: ${continueUrl}\nCheck your status: ${statusUrl}\n\nOur sales team will contact you with next steps.`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">${logoHtml}<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;"><h2 style="margin-top:0;">Dear ${details.fullName},</h2><p>Thank you. We received your purchase request for ${details.vehicleName}.</p><p><strong>Amount:</strong> ETB ${details.purchaseAmount.toLocaleString('en-US')}<br /><strong>Bank:</strong> ${details.bankName}<br /><strong>Purchase reference:</strong> ${details.purchaseReference}</p><p>Your order is pending approval by a sales agent. Once approved, we'll email you a sales agreement to review and sign, and you'll be able to continue to payment.</p><div style="text-align:center;margin:20px 0;"><a href="${continueUrl}" style="background:#1a2b4c;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 24px;border-radius:6px;display:inline-block;margin-right:8px;">Continue</a></div>${statusButtonHtml}<p>Our sales team will contact you with next steps.</p></div></div>`,
        attachments: logoAttachments,
      });
    }
  } catch (error) {
    console.error('[public:purchases:email]', error);
  }
}

export type PurchaseStatusResult =
  | { ok: true; purchase: { purchaseId: string; vehicle: string; amount: string; bank: string; transactionId: string; paymentReference: string; paymentStatus: string; purchaseStatus: string; approved: boolean } }
  | { ok: false; httpStatus: 404; error: string };

export async function getPurchaseStatus(purchaseId: string): Promise<PurchaseStatusResult> {
  const purchase = await messageRepository.findByCategoryAndSubject('Vehicle Purchase', `Vehicle Purchase - ${purchaseId}`);
  if (!purchase) return { ok: false, httpStatus: 404, error: 'Purchase not found.' };

  // Same correlation /api/payments/initiate uses to gate payment: the
  // purchase Message has no structured FK to its SalesOrder, so match the
  // purchase reference embedded in the Quotation's own message text.
  const linkedQuotation = await quotationRepository.findFirstByMessageContainsWithSalesOrder(`Purchase reference: ${purchaseId}`);
  const approved = Boolean(linkedQuotation?.salesOrder?.approvedAt);

  return {
    ok: true,
    purchase: {
      purchaseId,
      vehicle: value(purchase.content, 'Vehicle'),
      amount: value(purchase.content, 'Purchase amount'),
      bank: value(purchase.content, 'Bank'),
      transactionId: value(purchase.content, 'Transaction ID'),
      paymentReference: value(purchase.content, 'Payment reference'),
      paymentStatus: value(purchase.content, 'Payment status'),
      purchaseStatus: value(purchase.content, 'Purchase status'),
      approved,
    },
  };
}

export type PurchaseCallbackBody = {
  status?: 'PAID' | 'FAILED' | 'CANCELLED';
  transactionId?: string;
  providerReference?: string;
  failureReason?: string;
};

export type PurchaseCallbackResult =
  | { ok: true; status: string; message?: string }
  | { ok: false; httpStatus: 400 | 404; error: string };

/**
 * Bank/provider callback endpoint.
 * A real provider must authenticate this request with a signed webhook or
 * server-to-server verification. Sandbox callbacks use PAYMENT_CALLBACK_SECRET.
 */
export async function handlePurchaseCallback(purchaseId: string, body: PurchaseCallbackBody): Promise<PurchaseCallbackResult> {
  const status = body.status;
  if (!status || !body.transactionId) {
    return { ok: false, httpStatus: 400, error: 'Payment status and transaction ID are required.' };
  }

  const purchase = await messageRepository.findByCategoryAndSubject('Vehicle Purchase', `Vehicle Purchase - ${purchaseId}`);
  if (!purchase) return { ok: false, httpStatus: 404, error: 'Purchase not found.' };

  const existingStatus = purchase.content.match(/Payment status: (\w+)/)?.[1];
  if (existingStatus === 'PAID') {
    return { ok: true, status: 'PAID', message: 'Purchase was already paid.' };
  }

  const updatedContent = purchase.content
    .replace(/Payment status: \w+/, `Payment status: ${status}`)
    .replace(/Purchase status: [^\n]+/, `Purchase status: ${status === 'PAID' ? 'Payment Confirmed' : status === 'CANCELLED' ? 'Cancelled' : 'Payment Pending'}`)
    .replace(/Transaction ID: [^\n]+/, `Transaction ID: ${body.transactionId}`)
    .replace(/Payment reference: [^\n]+/, `Payment reference: ${body.providerReference || purchaseId}`)
    + (body.failureReason ? `\nFailure reason: ${body.failureReason}` : '');

  await messageRepository.update(purchase.id, { content: updatedContent, status: status === 'PAID' ? 'new' : 'unread' });

  if (status === 'PAID') {
    await sendCustomerConfirmation(purchase.email, purchase.from, purchase.subject, updatedContent);
  }

  return { ok: true, status };
}

async function sendCustomerConfirmation(email: string, customerName: string, subject: string, content: string) {
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  await transporter.sendMail({
    from,
    to: email,
    subject: `Your Geely Purchase Has Been Confirmed — ${subject.replace('Vehicle Purchase - ', '')}`,
    text: `Hello ${customerName},\n\nYour Geely purchase payment has been successfully received.\n\n${content}\n\nOur sales team will contact you regarding delivery.`,
  });
}
