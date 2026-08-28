import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitQuickRequest } from '@/lib/services/leads/quickRequestService';

// POST /api/public/quick-request
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const result = await submitQuickRequest(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, reference: result.reference, notificationSent: result.notificationSent }, { status: 201 });
  } catch (error) {
    console.error('[quick-request:create]', error);
    return NextResponse.json({ error: 'Unable to submit your request right now.' }, { status: 500 });
  }
}
