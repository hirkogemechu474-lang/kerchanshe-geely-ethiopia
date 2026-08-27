import { NextResponse } from "next/server";
import { initiatePayment } from "@/lib/services/payments/legacyPaymentService";

export async function POST(request: Request) {
  try {
    const { purchaseId } = await request.json();
    if (!purchaseId) return NextResponse.json({ success: false, error: "Purchase ID is required." }, { status: 400 });

    const result = await initiatePayment(purchaseId);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ success: true, payment: result.payment }, { status: result.created ? 201 : 200 });
  } catch (error) {
    console.error("[payments:initiate]", error);
    return NextResponse.json({ success: false, error: "Unable to initiate payment." }, { status: 500 });
  }
}
