import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { sendFormEmail } from '@/lib/form-email';
import { generateReference, REFERENCE_CATEGORY } from '@/lib/reference';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.showroomVisitRegister);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  if (!fullName || !phone) {
    return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
  }

  const existing = await prisma.showroomVisit.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Visit session not found. Please scan the QR code again.' }, { status: 404 });
  }

  // Idempotent: a refresh/back-button on this page just updates the same
  // row rather than erroring, since the visitor may legitimately resubmit.
  const isFirstRegistration = existing.status === 'started';

  const visit = await prisma.showroomVisit.update({
    where: { id },
    data: {
      fullName,
      phone,
      email: email || null,
      status: isFirstRegistration ? 'registered' : existing.status,
      registeredAt: existing.registeredAt || new Date(),
    },
  });

  // Only notify on the first registration, not on every idempotent resubmit.
  if (isFirstRegistration && email) {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://geelyethiopia.com').replace(/\/$/, '');
    const continueUrl = `${siteUrl}/models?visitId=${encodeURIComponent(visit.id)}`;
    try {
      // Human-friendly reference matching every other confirmation email
      // (GY-SQ-DDMMYYYY-NNN) instead of the internal visit.id UUID. Not
      // persisted — this visit is a browsing session, not itself something
      // customers look up on the status page.
      const reference = await generateReference(REFERENCE_CATEGORY.SHOWROOM_VISIT);
      await sendFormEmail({
        type: 'showroom visit',
        name: fullName,
        email,
        phone,
        subject: `Showroom walk-in — ${fullName}`,
        reference,
        details: `${fullName} registered at the showroom via the QR walk-in flow and is now browsing our vehicle catalog.\n\nContinue browsing: ${continueUrl}`,
      });
    } catch (emailError) {
      console.error('[visit:register:email]', emailError);
    }
  }

  return NextResponse.json({ visitId: visit.id, status: visit.status });
}
