import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitConfigs } from "@/lib/rate-limit";
import { submitPurchase, type PurchaseRequest } from "@/lib/services/purchases/purchaseService";

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, rateLimitConfigs.contactForm);
  if (limited) return limited;

  try {
    const body = (await request.json()) as PurchaseRequest;

    const result = await submitPurchase(body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({ success: true, purchase: result.purchase }, { status: 201 });
  } catch (error) {
    console.error("[public:purchases:post]", error);
    return NextResponse.json({ success: false, error: "Unable to process purchase." }, { status: 500 });
  }
}
