import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { stampCountersignedAgreement } from '@/lib/services/agreements/agreementService';

// Called server-to-server by admin/app/api/admin/orders/[id]/countersign
// right after it records countersignedAt/countersignedById — the signed
// agreement file only exists on web's disk (web/public/uploads), so admin
// can't stamp it directly. Same id-as-access-token pattern as every other
// public order route; the caller (admin's own server) is the only one who
// would ever know the right orderId + already have a countersign to report.
//
// Uses the countersigning user's own on-file signature image
// (User.signatureUrl, set once via web/app/staff-signature/[token]) when
// they have one, falling back to stamping their typed name for staff who
// haven't set one up yet.
//
// A no-op (not an error) when the signed document is a photo upload
// rather than the drawn-signature PDF — there's no live PDF to stamp
// onto in that case.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const agentId = typeof body?.agentId === 'string' ? body.agentId.trim() : '';
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  const result = await stampCountersignedAgreement(orderId, agentId);

  if ('ok' in result && !result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json(result);
}
