import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitTradeInRequest, type TradeInInput } from '@/lib/services/leads/tradeInService';

interface TradeInBody extends TradeInInput {
  consentGiven: boolean;
}

// POST /api/public/trade-in
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.leadForm);
  if (rateLimitResult) return rateLimitResult;

  let body: TradeInBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const required: Array<keyof TradeInBody> = [
    'firstName', 'lastName', 'email', 'phone',
    'currentMake', 'currentModel', 'currentYear', 'currentMileage', 'currentCondition',
    'hasAccidents', 'hasModifications', 'serviceHistory',
    'interestedModel', 'purchaseTimeframe', 'financingNeeded',
  ];
  for (const field of required) {
    if (!String(body[field] ?? '').trim()) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
    }
  }
  if (!body.consentGiven) {
    return NextResponse.json({ error: 'User consent is required' }, { status: 400 });
  }

  try {
    const result = await submitTradeInRequest(body);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    console.error('[trade-in:create]', error);
    return NextResponse.json({ error: 'Could not submit your trade-in request. Please try again.' }, { status: 500 });
  }
}
