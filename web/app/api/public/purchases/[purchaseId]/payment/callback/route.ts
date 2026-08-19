import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

type CallbackBody = {
  status?: "PAID" | "FAILED" | "CANCELLED";
  transactionId?: string;
  providerReference?: string;
  failureReason?: string;
};

/**
 * Bank/provider callback endpoint.
 * A real provider must authenticate this request with a signed webhook or
 * server-to-server verification. Sandbox callbacks use PAYMENT_CALLBACK_SECRET.
 */
export async function POST(request: Request, context: { params: Promise<{ purchaseId: string }> }) {
  const expectedSecret = process.env.PAYMENT_CALLBACK_SECRET;
  const suppliedSecret = request.headers.get("x-payment-callback-secret");
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized payment callback." }, { status: 401 });
  }

  try {
    const { purchaseId } = await context.params;
    const body = (await request.json()) as CallbackBody;
    const status = body.status;
    if (!status || !body.transactionId) {
      return NextResponse.json({ success: false, error: "Payment status and transaction ID are required." }, { status: 400 });
    }

    const purchase = await prisma.message.findFirst({
      where: { category: "Vehicle Purchase", subject: `Vehicle Purchase - ${purchaseId}` },
    });
    if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found." }, { status: 404 });

    const existingStatus = purchase.content.match(/Payment status: (\w+)/)?.[1];
    if (existingStatus === "PAID") {
      return NextResponse.json({ success: true, status: "PAID", message: "Purchase was already paid." });
    }

    const updatedContent = purchase.content
      .replace(/Payment status: \w+/, `Payment status: ${status}`)
      .replace(/Purchase status: [^\n]+/, `Purchase status: ${status === "PAID" ? "Payment Confirmed" : status === "CANCELLED" ? "Cancelled" : "Payment Pending"}`)
      .replace(/Transaction ID: [^\n]+/, `Transaction ID: ${body.transactionId}`)
      .replace(/Payment reference: [^\n]+/, `Payment reference: ${body.providerReference || purchaseId}`)
      + (body.failureReason ? `\nFailure reason: ${body.failureReason}` : "");

    await prisma.message.update({
      where: { id: purchase.id },
      data: { content: updatedContent, status: status === "PAID" ? "new" : "unread" },
    });

    if (status === "PAID") {
      await sendCustomerConfirmation(purchase.email, purchase.from, purchase.subject, updatedContent);
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("[public:purchases:callback]", error);
    return NextResponse.json({ success: false, error: "Unable to update payment status." }, { status: 500 });
  }
}

async function sendCustomerConfirmation(email: string, customerName: string, subject: string, content: string) {
  if (process.env.SMTP_ENABLED !== "true" || !process.env.SMTP_USER || !process.env.SMTP_PASS) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || "Geely Ethiopia"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  await transporter.sendMail({
    from,
    to: email,
    subject: `Your Geely Purchase Has Been Confirmed — ${subject.replace("Vehicle Purchase - ", "")}`,
    text: `Hello ${customerName},\n\nYour Geely purchase payment has been successfully received.\n\n${content}\n\nOur sales team will contact you regarding delivery.`,
  });
}
