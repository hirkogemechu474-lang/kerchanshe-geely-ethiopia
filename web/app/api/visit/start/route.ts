import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';

// Showroom QR walk-in flow: the static QR poster/screen encodes this route.
// Every scan mints a fresh ShowroomVisit — the QR itself never changes or
// carries a token, so a session is created here rather than decoded from
// the URL.
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.showroomVisitStart);
  if (rateLimitResult) return rateLimitResult;

  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || null;
  const userAgent = request.headers.get('user-agent');

  const visit = await prisma.showroomVisit.create({
    data: {
      status: 'started',
      ipAddress,
      userAgent,
    },
  });

  return NextResponse.json({ visitId: visit.id }, { status: 201 });
}
