import { NextResponse } from "next/server";

type DirectPaymentRequest = {
  amount?: number;
  currency?: string;
  customerEmail?: string;
  vehicleId?: string;
  vehicleName?: string;
  programId?: string;
  programName?: string;
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Mock payment gateway for the direct financing flow.
 * Replace this route's implementation with the real provider integration
 * when payment credentials and webhook handling are available.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DirectPaymentRequest;
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

    // Simulate the network and provider processing time of a real gateway.
    await wait(900);

    // This makes the mock useful for testing failure handling without a live gateway.
    // A caller can send x-mock-payment-result: declined to receive a declined response.
    if (request.headers.get("x-mock-payment-result") === "declined") {
      return NextResponse.json(
        {
          success: false,
          status: "declined",
          error: "The payment provider declined this transaction.",
          transactionId: `txn_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`,
        },
        { status: 402 }
      );
    }

    const transactionId = `txn_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const processedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      status: "succeeded",
      message: "Payment processed successfully.",
      transactionId,
      payment: {
        amount: Math.round(amount * 100) / 100,
        currency: body.currency || "ETB",
        vehicleId: body.vehicleId || null,
        vehicleName: body.vehicleName || null,
        programId: body.programId || null,
        programName: body.programName || null,
        processedAt,
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
