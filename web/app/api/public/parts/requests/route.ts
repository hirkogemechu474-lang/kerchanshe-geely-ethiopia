import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitPartRequest } from '@/lib/services/parts/partRequestService';

/**
 * POST /api/public/parts/requests
 * Submit a parts request / quote from the public parts page cart.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.partsRequest);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const result = await submitPartRequest(body);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, request: result.request, reference: result.reference, notificationSent: result.notificationSent }, { status: 201 });
  } catch (error) {
    console.error('Error creating part request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
