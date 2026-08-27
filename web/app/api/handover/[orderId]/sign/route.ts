import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { signHandover } from '@/lib/services/handovers/handoverService';

// Public — completes the self-service handover sign-off, mirroring
// web/app/api/agreement/[orderId]/sign/route.ts exactly (same two modes,
// same one-way-only guard against overwriting an existing signature).
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.handoverSign);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const result = await signHandover(orderId, type, {
    signatureDataUrl: body?.signatureDataUrl,
    photoUrl: body?.photoUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({
    handoverSignedDocumentUrl: result.handoverSignedDocumentUrl,
    handoverSignedAt: result.handoverSignedAt,
  });
}
