import { NextResponse } from "next/server";
import { getPurchaseStatus } from "@/lib/services/purchases/purchaseService";

export async function GET(_request: Request, context: { params: Promise<{ purchaseId: string }> }) {
  const { purchaseId } = await context.params;
  const result = await getPurchaseStatus(purchaseId);
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
  return NextResponse.json({ success: true, purchase: result.purchase });
}
