import { NextResponse } from "next/server";
import { getPaymentProvider, type PaymentRequest } from "@/lib/payments/provider";

/**
 * Mock payment gateway for the direct financing flow.
 * Replace this route's implementation with the real provider integration
 * when payment credentials and webhook handling are available.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PaymentRequest>;
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid payment amount is required." },
        { status: 400 }
      );
    }

    if (body.customerEmail && !/^\S+@\S+\.\S+$/.test(body.customerEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid customer email is required." },
        { status: 400 }
      );
    }

    const result = await getPaymentProvider().createPayment({
      amount,
      currency: body.currency || "ETB",
      customerEmail: body.customerEmail,
      vehicleId: body.vehicleId,
      vehicleName: body.vehicleName,
      programId: body.programId,
      programName: body.programName,
    }, request.headers.get("x-mock-payment-result"));

    if (result.status === 'declined') {
      return NextResponse.json(
        {
          success: false,
          status: result.status,
          error: result.error,
          transactionId: result.transactionId,
        },
        { status: 402 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      message: "Payment processed successfully.",
      transactionId: result.transactionId,
      payment: {
        amount: Math.round(amount * 100) / 100,
        currency: body.currency || "ETB",
        vehicleId: body.vehicleId || null,
        vehicleName: body.vehicleName || null,
        programId: body.programId || null,
        programName: body.programName || null,
        processedAt: result.processedAt,
      },
    });
  } catch (error) {
    console.error("[mock-direct-payment] Failed to process payment:", error);
    return NextResponse.json(
      { success: false, error: "Unable to process payment at this time." },
      { status: 500 }
    );
  }
}
