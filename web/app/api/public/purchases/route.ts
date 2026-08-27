import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { PDI_CHECKLIST_TEMPLATE } from "@/lib/sales/pdiChecklistTemplate";
import { generateReference } from "@/lib/reference";

// Most mail clients (Gmail included) won't fetch an <img src> pointing at
// http://localhost, and many block remote images by default even when the
// URL is public — so the logo is attached inline via cid instead of linked.
function readLogoBytes(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "assets", "logos", "geely-logo.png"));
  } catch {
    return null;
  }
}

type PurchaseRequest = {
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

// Mirrors admin/lib/sales/orderNumber.ts — web can't import across the app
// boundary, so this is a deliberate parallel copy (same convention as the
// service-check-in kiosk's own nextJobCardNo()).
async function nextSalesOrderNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: "salesOrder" },
    create: { name: "salesOrder", value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `SO-${counter.value}`;
}

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
  if (details.quoteReference && !details.quoteReference.startsWith("qr-visit-")) {
    quotation = await prisma.quotation
      .findUnique({ where: { id: details.quoteReference }, include: { salesOrder: true } })
      .catch(() => null);
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
      quotation = await prisma.quotation.update({
        where: { id: quotation.id },
        data: { message: `${quotation.message ? `${quotation.message}\n` : ""}Purchase reference: ${details.purchaseReference}` },
        include: { salesOrder: true },
      });
    }
  }

  if (!quotation) {
    quotation = await prisma.quotation.create({
      data: {
        customerName: details.fullName,
        phoneNumber: details.phone,
        email: details.email,
        vehicleModel: details.vehicleName,
        financingInterest: true,
        message: `Direct vehicle purchase — ${details.quantity}x, color: ${details.color || "Not specified"}, bank: ${details.bankName}. Purchase reference: ${details.purchaseReference}`,
        configurationJson,
        source: details.visitId ? "qr-showroom" : "website",
        status: "new",
      },
      include: { salesOrder: true },
    });
  }

  let salesOrder = quotation.salesOrder;
  if (!salesOrder) {
    const orderNo = await nextSalesOrderNo();
    salesOrder = await prisma.salesOrder.create({
      data: {
        orderNo,
        quotationId: quotation.id,
        customerName: details.fullName,
        customerPhone: details.phone,
        customerEmail: details.email,
        vehicleModel: details.vehicleName,
        configurationJson: quotation.configurationJson ?? undefined,
        totalPrice: details.purchaseAmount,
        financingStatus: "PENDING",
        status: "BOOKED",
        statusHistory: {
          create: { fromStatus: null, toStatus: "BOOKED", changedById: "qr-showroom-direct-purchase" },
        },
        pdiItems: { create: PDI_CHECKLIST_TEMPLATE.map((label) => ({ label })) },
      },
    });
    if (quotation.status !== "converted") {
      await prisma.quotation.update({ where: { id: quotation.id }, data: { status: "converted" } });
    }
  }

  if (details.visitId) {
    await prisma.showroomVisit
      .update({ where: { id: details.visitId }, data: { quotationId: quotation.id, salesOrderId: salesOrder.id } })
      .catch(() => {});
  }

  return { approved: Boolean(salesOrder.approvedAt) };
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitConfigs.contactForm);
  if (limited) return limited;

  try {
    const body = (await request.json()) as PurchaseRequest;
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const nationalId = String(body.nationalId || "").trim();
    const address = String(body.address || "").trim();
    const vehicleId = String(body.vehicleId || "").trim();
    const bankId = String(body.bankId || "").trim();
    const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 0));

    if (!fullName || !phone || !nationalId || !address || !vehicleId || !bankId || !body.consent || quantity < 1) {
      return NextResponse.json({ success: false, error: "Please complete all required purchase details." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "A valid email address is required." }, { status: 400 });
    }

    const [vehicle, bank] = await Promise.all([
      prisma.vehicle.findFirst({ where: { id: vehicleId, isActive: true, status: "published" }, select: { id: true, name: true, finalPrice: true, basePrice: true } }),
      prisma.financingBank.findFirst({ where: { id: bankId, isActive: true }, select: { id: true, name: true, websiteUrl: true } }),
    ]);
    if (!vehicle) return NextResponse.json({ success: false, error: "Vehicle is no longer available." }, { status: 404 });
    if (!bank) return NextResponse.json({ success: false, error: "Selected bank is not available." }, { status: 400 });

    const supportedProgram = await prisma.financingProgram.findFirst({
      where: {
        bankId,
        status: "PUBLISHED",
        OR: [{ appliesToAllVehicles: true }, { vehicleId }],
      },
      select: { id: true, directPayUrl: true },
    });
    if (!supportedProgram) {
      return NextResponse.json({ success: false, error: "This bank does not currently support the selected vehicle." }, { status: 400 });
    }

    const purchaseAmount = (vehicle.finalPrice ?? vehicle.basePrice) * quantity;
    const purchaseReference = await generateReference();
    const transactionId = "PENDING";

    // Payment remains pending until the selected provider confirms it through the callback route.
    // Sandbox callbacks can be enabled explicitly with PAYMENT_MODE=sandbox.
    let paymentStatus: string = "PENDING";
    const purchaseStatus = paymentStatus === "PAID" ? "Payment Confirmed" : "Payment Pending";
    const content = [
      `Purchase ID: ${purchaseReference}`,
      `Customer: ${fullName}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `National ID / Passport: ${nationalId}`,
      `Vehicle: ${vehicle.name} (${vehicle.id})`,
      `Quantity: ${quantity}`,
      `Preferred color: ${String(body.color || "Not specified")}`,
      `Purchase amount: ETB ${purchaseAmount.toLocaleString("en-US")}`,
      `Bank: ${bank.name}`,
      `Payment method: Bank online payment`,
      `Payment status: ${paymentStatus}`,
      `Purchase status: ${purchaseStatus}`,
      `Transaction ID: ${transactionId}`,
      `Payment reference: ${purchaseReference}`,
      `Address: ${address}`,
    ].join("\n");

    const record = await prisma.message.create({
      data: {
        from: fullName,
        email,
        subject: `Vehicle Purchase - ${purchaseReference}`,
        category: "Vehicle Purchase",
        priority: "high",
        status: paymentStatus === "PAID" ? "new" : "unread",
        content,
        reference: purchaseReference,
      },
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
        color: String(body.color || ""),
        quantity,
        bankName: bank.name,
        purchaseAmount,
        purchaseReference,
        quoteReference: typeof body.quoteReference === "string" ? body.quoteReference.trim() : undefined,
        visitId: typeof body.visitId === "string" && body.visitId ? body.visitId : undefined,
      });
      approved = pipelineResult.approved;
    } catch (pipelineError) {
      console.error("[public:purchases:sales-pipeline]", pipelineError);
    }

    return NextResponse.json({
      success: true,
      purchase: {
        purchaseId: purchaseReference,
        transactionId,
        paymentReference: purchaseReference,
        paymentDate: new Date().toISOString(),
        status: paymentStatus,
        checkoutUrl: supportedProgram.directPayUrl || bank.websiteUrl || null,
        approved,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[public:purchases:post]", error);
    return NextResponse.json({ success: false, error: "Unable to process purchase." }, { status: 500 });
  }
}

async function sendPurchaseEmail(details: { fullName: string; email: string; vehicleName: string; bankName: string; purchaseAmount: number; purchaseReference: string; transactionId: string; recordId: string; paymentStatus: string }) {
  if (process.env.SMTP_ENABLED !== "true" || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || "Geely Ethiopia"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  try {
    await transporter.sendMail({
      from,
      to: process.env.ADMIN_EMAIL,
      replyTo: details.email,
      subject: `New Vehicle Purchase - ${details.purchaseReference}`,
      text: `New vehicle purchase request\n\nCustomer: ${details.fullName}\nEmail: ${details.email}\nVehicle: ${details.vehicleName}\nAmount: ETB ${details.purchaseAmount.toLocaleString("en-US")}\nBank: ${details.bankName}\nPayment status: ${details.paymentStatus}\nPurchase reference: ${details.purchaseReference}\nTransaction ID: ${details.transactionId}\nInternal record: ${details.recordId}`,
    });

    // The customer's only way back to this purchase (short of the later
    // approval email) — the confirmation screen otherwise only lives in
    // that page's local state and is lost the moment the tab closes.
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://geelyethiopia.com").replace(/\/$/, "");
    const continueUrl = `${siteUrl}/financing/apply?purchaseId=${encodeURIComponent(details.purchaseReference)}`;
    const statusUrl = `${siteUrl}/status?ref=${encodeURIComponent(details.purchaseReference)}`;
    const logoHtml = `<div style="text-align:center;padding:24px 0;"><img src="cid:geely-logo" alt="Geely" style="height:56px;" /></div>`;
    const statusButtonHtml = `<div style="text-align:center;margin:28px 0;"><a href="${statusUrl}" style="background:#0b5fff;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:6px;display:inline-block;">Check Your Status</a></div>`;
    const logoBytes = readLogoBytes();
    const logoAttachments = logoBytes ? [{ filename: "geely-logo.png", content: logoBytes, cid: "geely-logo" }] : undefined;

    if (details.paymentStatus === "PAID") {
      await transporter.sendMail({
        from,
        to: details.email,
        subject: "Geely Ethiopia Purchase Confirmation",
        text: `Dear ${details.fullName},\n\nYour purchase of ${details.vehicleName} has been confirmed.\nAmount: ETB ${details.purchaseAmount.toLocaleString("en-US")}\nBank: ${details.bankName}\nPurchase reference: ${details.purchaseReference}\nTransaction ID: ${details.transactionId}\n\nCheck your status: ${statusUrl}\n\nOur sales team will contact you about delivery.`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">${logoHtml}<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;"><h2 style="margin-top:0;">Dear ${details.fullName},</h2><p>Your purchase of ${details.vehicleName} has been confirmed.</p><p><strong>Amount:</strong> ETB ${details.purchaseAmount.toLocaleString("en-US")}<br /><strong>Bank:</strong> ${details.bankName}<br /><strong>Purchase reference:</strong> ${details.purchaseReference}<br /><strong>Transaction ID:</strong> ${details.transactionId}</p>${statusButtonHtml}<p>Our sales team will contact you about delivery.</p></div></div>`,
        attachments: logoAttachments,
      });
    } else {
      await transporter.sendMail({
        from,
        to: details.email,
        subject: `Geely Ethiopia — Purchase Received (${details.purchaseReference})`,
        text: `Dear ${details.fullName},\n\nThank you. We received your purchase request for ${details.vehicleName}.\nAmount: ETB ${details.purchaseAmount.toLocaleString("en-US")}\nBank: ${details.bankName}\nPurchase reference: ${details.purchaseReference}\n\nYour order is pending approval by a sales agent. Once approved, we'll email you a sales agreement to review and sign, and you'll be able to continue to payment.\n\nContinue: ${continueUrl}\nCheck your status: ${statusUrl}\n\nOur sales team will contact you with next steps.`,
        html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a2b4c;">${logoHtml}<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:32px;"><h2 style="margin-top:0;">Dear ${details.fullName},</h2><p>Thank you. We received your purchase request for ${details.vehicleName}.</p><p><strong>Amount:</strong> ETB ${details.purchaseAmount.toLocaleString("en-US")}<br /><strong>Bank:</strong> ${details.bankName}<br /><strong>Purchase reference:</strong> ${details.purchaseReference}</p><p>Your order is pending approval by a sales agent. Once approved, we'll email you a sales agreement to review and sign, and you'll be able to continue to payment.</p><div style="text-align:center;margin:20px 0;"><a href="${continueUrl}" style="background:#1a2b4c;color:#ffffff;text-decoration:none;font-weight:bold;padding:10px 24px;border-radius:6px;display:inline-block;margin-right:8px;">Continue</a></div>${statusButtonHtml}<p>Our sales team will contact you with next steps.</p></div></div>`,
        attachments: logoAttachments,
      });
    }
  } catch (error) {
    console.error("[public:purchases:email]", error);
  }
}
