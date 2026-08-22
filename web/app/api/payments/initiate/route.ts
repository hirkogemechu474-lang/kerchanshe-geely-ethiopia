import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const value = (content: string, label: string) =>
  content.split("\n").find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || "";

export async function POST(request: Request) {
  try {
    const { purchaseId } = await request.json();
    if (!purchaseId) return NextResponse.json({ success: false, error: "Purchase ID is required." }, { status: 400 });

    const purchase = await prisma.message.findFirst({ where: { category: "Vehicle Purchase", subject: `Vehicle Purchase - ${purchaseId}` } });
    if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found." }, { status: 404 });

    const purchaseStatus = value(purchase.content, "Payment status");
    if (purchaseStatus === "PAID") return NextResponse.json({ success: false, message: "This purchase has already been paid." }, { status: 409 });

    // Payment cannot start until a sales agent has approved the resulting
    // order (see docs/SWMS-INTEGRATION-BACKLOG.md Phase 16) — enforced here
    // server-side, not just by hiding the "Continue to Bank Payment" button,
    // so it can't be bypassed by calling this route directly. The purchase
    // Message and its SalesOrder aren't linked by a structured FK (Message
    // has no such field), so this looks them up the same way the rest of
    // this pipeline already correlates records: matching the purchase
    // reference embedded in the Quotation's own message text.
    const linkedQuotation = await prisma.quotation.findFirst({
      where: { message: { contains: `Purchase reference: ${purchaseId}` } },
      include: { salesOrder: true },
    });
    if (!linkedQuotation?.salesOrder?.approvedAt) {
      return NextResponse.json({
        success: false,
        error: "This order is pending sales approval. You'll receive an email to review and sign your agreement once it's approved — payment can proceed after that.",
      }, { status: 403 });
    }

    const existing = await prisma.message.findFirst({
      where: { category: "Vehicle Payment", content: { contains: `Purchase ID: ${purchaseId}` } },
      orderBy: { createdAt: "desc" },
    });
    if (existing && value(existing.content, "Payment status") === "PENDING") {
      return NextResponse.json({ success: true, payment: paymentResponse(existing.id, existing.content) });
    }

    const paymentId = `PAY-${new Date().getFullYear()}-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
    const bank = value(purchase.content, "Bank");
    const paymentContent = [
      `Payment ID: ${paymentId}`,
      `Purchase ID: ${purchaseId}`,
      `Payment reference: ${value(purchase.content, "Payment reference") || purchaseId}`,
      `Customer: ${purchase.from}`,
      `Vehicle: ${value(purchase.content, "Vehicle")}`,
      `Amount: ${value(purchase.content, "Purchase amount")}`,
      `Bank: ${bank}`,
      `Currency: ETB`,
      `Payment status: PENDING`,
      `Transaction ID: PENDING`,
      `Purchase status: Payment Pending`,
    ].join("\n");
    const payment = await prisma.message.create({
      data: { from: purchase.from, email: purchase.email, subject: `Vehicle Payment - ${paymentId}`, category: "Vehicle Payment", priority: "high", status: "unread", content: paymentContent },
    });

    return NextResponse.json({ success: true, payment: paymentResponse(payment.id, payment.content) }, { status: 201 });
  } catch (error) {
    console.error("[payments:initiate]", error);
    return NextResponse.json({ success: false, error: "Unable to initiate payment." }, { status: 500 });
  }
}

function paymentResponse(id: string, content: string) {
  const paymentId = value(content, "Payment ID");
  return {
    paymentId,
    purchaseId: value(content, "Purchase ID"),
    paymentReference: value(content, "Payment reference"),
    amount: value(content, "Amount"),
    currency: "ETB",
    bank: value(content, "Bank"),
    vehicle: value(content, "Vehicle"),
    status: value(content, "Payment status"),
    paymentUrl: `/payment/mock/${paymentId}`,
    recordId: id,
  };
}
