import { NextResponse } from "next/server";
import { getPayment } from "@/lib/services/payments/legacyPaymentService";

export async function GET(_request: Request, context: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await context.params;
  const result = await getPayment(paymentId);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
  return NextResponse.json({ success: true, payment: result.payment });
}
