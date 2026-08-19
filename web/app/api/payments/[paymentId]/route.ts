import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const value = (content: string, label: string) => content.split("\n").find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || "";

export async function GET(_request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await context.params;
  const payment = await prisma.message.findFirst({ where: { category: "Vehicle Payment", subject: `Vehicle Payment - ${paymentId}` } });
  if (!payment) return NextResponse.json({ success: false, error: "Payment session not found." }, { status: 404 });
  return NextResponse.json({ success: true, payment: { paymentId, purchaseId: value(payment.content, "Purchase ID"), paymentReference: value(payment.content, "Payment reference"), vehicle: value(payment.content, "Vehicle"), amount: value(payment.content, "Amount"), bank: value(payment.content, "Bank"), status: value(payment.content, "Payment status") } });
}
