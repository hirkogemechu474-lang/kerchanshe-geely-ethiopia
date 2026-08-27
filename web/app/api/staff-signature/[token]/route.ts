import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { lookupSignatureToken } from '@/lib/services/staffSignature/staffSignatureService';

// Public — same random-token-as-access-key pattern as every other
// self-service link in this codebase, just for a staff member setting up
// their own signature (see admin/app/api/admin/users/[id]/signature-link)
// rather than a customer signing a document.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementView);
  if (rateLimitResult) return rateLimitResult;

  const { token } = await params;
  const result = await lookupSignatureToken(token);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ name: result.name, hasExistingSignature: result.hasExistingSignature });
}
