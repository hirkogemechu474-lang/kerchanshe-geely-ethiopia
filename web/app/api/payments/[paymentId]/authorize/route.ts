import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const value = (content: string, label: string) => content.split("\n").find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || "";

export async function POST(request: Request, context: { params: Promise<{ paymentId: string }> }) {
  try {
    const { paymentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const payment = await prisma.message.findFirst({ where: { category: "Vehicle Payment", subject: `Vehicle Payment - ${paymentId}` } });
    if (!payment) return NextResponse.json({ success: false, error: "Payment session not found." }, { status: 404 });
    const currentStatus = value(payment.content, "Payment status");
    if (currentStatus === "PAID") return NextResponse.json({ success: true, status: "PAID", transactionId: value(payment.content, "Transaction ID"), paymentReference: value(payment.content, "Payment reference") });

    const status = body.action === "cancel" ? "CANCELLED" : body.action === "fail" ? "FAILED" : "PAID";
    const transactionId = status === "PAID" ? `MOCK-${value(payment.content, "Bank").replace(/[^A-Za-z]/g, "").slice(0, 8).toUpperCase() || "BANK"}-${new Date().getTime()}` : `CANCELLED-${paymentId}`;
    const purchaseId = value(payment.content, "Purchase ID");
    const updatedPaymentContent = payment.content.replace(/Payment status: \w+/, `Payment status: ${status}`).replace(/Transaction ID: [^\n]+/, `Transaction ID: ${transactionId}`).replace(/Purchase status: [^\n]+/, `Purchase status: ${status === "PAID" ? "Payment Confirmed" : "Payment Pending"}`) + `\nCompleted at: ${new Date().toISOString()}`;
    await prisma.message.update({ where: { id: payment.id }, data: { content: updatedPaymentContent, status: status === "PAID" ? "new" : "unread" } });

    const purchase = await prisma.message.findFirst({ where: { category: "Vehicle Purchase", subject: `Vehicle Purchase - ${purchaseId}` } });
    if (purchase) {
      const updatedPurchaseContent = purchase.content.replace(/Payment status: \w+/, `Payment status: ${status}`).replace(/Purchase status: [^\n]+/, `Purchase status: ${status === "PAID" ? "Payment Confirmed" : "Payment Pending"}`).replace(/Transaction ID: [^\n]+/, `Transaction ID: ${transactionId}`);
      await prisma.message.update({ where: { id: purchase.id }, data: { content: updatedPurchaseContent, status: status === "PAID" ? "new" : "unread" } });
      if (status === "PAID") {
        await prisma.message.create({ data: { from: "Payment System", email: purchase.email, subject: "New Vehicle Purchase Payment", category: "Admin Notification", priority: "high", status: "unread", content: `Customer: ${purchase.from}\nVehicle: ${value(purchase.content, "Vehicle")}\nAmount: ${value(purchase.content, "Purchase amount")}\nBank: ${value(purchase.content, "Bank")}\nTransaction: ${transactionId}\nStatus: PAID\nPurchase ID: ${purchaseId}` } });
        await sendPaymentEmails(purchase, updatedPurchaseContent, transactionId, purchaseId);
      }
    }

    return NextResponse.json({ success: status === "PAID", status, transactionId, paymentReference: value(payment.content, "Payment reference"), amount: value(payment.content, "Amount"), currency: "ETB" });
  } catch (error) {
    console.error("[payments:authorize]", error);
    return NextResponse.json({ success: false, error: "Unable to authorize payment." }, { status: 500 });
  }
}

async function sendPaymentEmails(purchase: { from: string; email: string; content: string }, content: string, transactionId: string, purchaseId: string) {
  if (process.env.SMTP_ENABLED !== "true" || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.ADMIN_EMAIL) return;
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || "smtp.gmail.com", port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  const from = `"${process.env.SMTP_FROM_NAME || "Geely Ethiopia"}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;
  const details = `Customer: ${purchase.from}\nEmail: ${purchase.email}\n${content}\nTransaction ID: ${transactionId}\nPurchase ID: ${purchaseId}`;
  await transporter.sendMail({ from, to: process.env.ADMIN_EMAIL, replyTo: purchase.email, subject: "New Geely Vehicle Purchase Payment Confirmed", text: details });
  await transporter.sendMail({ from, to: purchase.email, subject: "Your Geely Payment Has Been Confirmed", text: `Hello ${purchase.from},\n\nYour Geely payment has been successfully received.\n\n${details}\n\nOur sales team will contact you regarding delivery.` });
}
