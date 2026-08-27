import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { completeSignatureSetup } from '@/lib/services/staffSignature/staffSignatureService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementSign);
  if (rateLimitResult) return rateLimitResult;

  const { token } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type === 'drawn' || body?.type === 'photo' ? body.type : null;
  if (!type) {
    return NextResponse.json({ error: 'Invalid signing type' }, { status: 400 });
  }

  const result = await completeSignatureSetup(token, type, {
    signatureDataUrl: body?.signatureDataUrl,
    photoUrl: body?.photoUrl,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ signatureUrl: result.signatureUrl });
}
