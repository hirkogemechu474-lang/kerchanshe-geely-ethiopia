import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const value = (content: string, label: string) => content.split("\n").find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || "";

export async function GET(_request: Request, context: { params: Promise<{ purchaseId: string }> }) {
  const { purchaseId } = await context.params;
  const purchase = await prisma.message.findFirst({ where: { category: "Vehicle Purchase", subject: `Vehicle Purchase - ${purchaseId}` } });
  if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found." }, { status: 404 });
  return NextResponse.json({ success: true, purchase: { purchaseId, vehicle: value(purchase.content, "Vehicle"), amount: value(purchase.content, "Purchase amount"), bank: value(purchase.content, "Bank"), transactionId: value(purchase.content, "Transaction ID"), paymentReference: value(purchase.content, "Payment reference"), paymentStatus: value(purchase.content, "Payment status"), purchaseStatus: value(purchase.content, "Purchase status") } });
}
