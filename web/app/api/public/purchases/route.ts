import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import nodemailer from "nodemailer";

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
};

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

    return NextResponse.json({
      success: true,
      purchase: {
        purchaseId: purchaseReference,
        transactionId,
        paymentReference: purchaseReference,
        paymentDate: new Date().toISOString(),
        status: paymentStatus,
        checkoutUrl: supportedProgram.directPayUrl || bank.websiteUrl || null,
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
