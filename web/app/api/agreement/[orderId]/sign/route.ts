import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { signAgreement } from '@/lib/services/agreements/agreementService';

// Public — completes the self-service "e-sign or attach" step. Two ways
// in, both one-way (an already-signed order 409s rather than overwriting):
// - `type: 'drawn'` — a PNG data URL from the signing page's canvas is
//   stamped onto the base PDF and saved as the customer's signed copy.
// - `type: 'photo'` — the customer already uploaded a photo of a signed
//   printout via the existing public POST /api/upload/image, and this
//   just records that URL against the order.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementSign);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const result = await signAgreement(orderId, type, {
    signatureDataUrl: body?.signatureDataUrl,
    photoUrl: body?.photoUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ signedDocumentUrl: result.signedDocumentUrl, signedAt: result.signedAt });
}
