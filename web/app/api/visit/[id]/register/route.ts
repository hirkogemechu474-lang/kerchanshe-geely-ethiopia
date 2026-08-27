import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { registerVisit } from '@/lib/services/showroomVisits/showroomVisitService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.showroomVisitRegister);
  if (rateLimitResult) return rateLimitResult;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  const result = await registerVisit(id, { fullName, phone, email });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ visitId: result.visitId, status: result.status });
}
