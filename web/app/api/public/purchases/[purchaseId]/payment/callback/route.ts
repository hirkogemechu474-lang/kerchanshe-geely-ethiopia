import { NextResponse } from "next/server";
import { handlePurchaseCallback, type PurchaseCallbackBody } from "@/lib/services/purchases/purchaseService";

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
    const body = (await request.json()) as PurchaseCallbackBody;

    const result = await handlePurchaseCallback(purchaseId, body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ success: true, status: result.status, message: result.message });
  } catch (error) {
    console.error("[public:purchases:callback]", error);
    return NextResponse.json({ success: false, error: "Unable to update payment status." }, { status: 500 });
  }
}
