import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Public — same random-token-as-access-key pattern as every other
// self-service link in this codebase, just for a staff member setting up
// their own signature (see admin/app/api/admin/users/[id]/signature-link)
// rather than a customer signing a document.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.agreementView);
  if (rateLimitResult) return rateLimitResult;

  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { signatureSetupToken: token } });
  if (!user) {
    return NextResponse.json({ error: 'This signature link is invalid or has already been used.' }, { status: 404 });
  }
  if (!user.signatureSetupTokenExpiresAt || user.signatureSetupTokenExpiresAt < new Date()) {
    return NextResponse.json({ error: 'This signature link has expired. Ask your admin to send a new one.' }, { status: 409 });
  }

  return NextResponse.json({
    name: user.name,
    hasExistingSignature: Boolean(user.signatureUrl),
  });
}
