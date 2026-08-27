import { NextResponse } from "next/server";
import { authorizePayment } from "@/lib/services/payments/legacyPaymentService";

export async function POST(request: Request, context: { params: Promise<{ paymentId: string }> }) {
  try {
    const { paymentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await authorizePayment(paymentId, body.action);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({
      success: result.success,
      status: result.status,
      transactionId: result.transactionId,
      paymentReference: result.paymentReference,
      amount: result.amount,
      currency: result.currency,
    });
  } catch (error) {
    console.error("[payments:authorize]", error);
    return NextResponse.json({ success: false, error: "Unable to authorize payment." }, { status: 500 });
  }
}
