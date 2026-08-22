import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import nodemailer from "nodemailer";
import { PDI_CHECKLIST_TEMPLATE } from "@/lib/sales/pdiChecklistTemplate";

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
    const purchaseReference = `GEO-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
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
    if (details.paymentStatus === "PAID") {
      await transporter.sendMail({
        from,
        to: details.email,
        subject: "Geely Ethiopia Purchase Confirmation",
        text: `Dear ${details.fullName},\n\nYour purchase of ${details.vehicleName} has been confirmed.\nAmount: ETB ${details.purchaseAmount.toLocaleString("en-US")}\nBank: ${details.bankName}\nPurchase reference: ${details.purchaseReference}\nTransaction ID: ${details.transactionId}\n\nOur sales team will contact you about delivery.`,
      });
    }
  } catch (error) {
    console.error("[public:purchases:email]", error);
  }
}
