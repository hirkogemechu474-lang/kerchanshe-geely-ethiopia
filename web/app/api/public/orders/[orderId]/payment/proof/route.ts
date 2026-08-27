import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitPaymentProof } from '@/lib/services/orders/orderPaymentService';

// Customer submits a bank-transfer receipt (uploaded via
// /api/upload/document first) — moves the order to PENDING_REVIEW for
// staff to confirm/reject (see admin/app/api/admin/orders/[id]/payment/confirm).
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentSubmit);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);

  const result = await submitPaymentProof(orderId, body?.proofUrl);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ paymentStatus: result.paymentStatus, paymentProofUrl: result.paymentProofUrl });
}
