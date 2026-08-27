import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { stampCountersignedHandover } from '@/lib/services/handovers/handoverService';

// Called server-to-server by
// admin/app/api/admin/orders/[id]/handover-countersign right after it
// records handoverCountersignedAt/handoverCountersignedById — mirrors
// /api/agreement/[orderId]/countersign-stamp exactly, just for the
// handover confirmation instead of the sales agreement. Uses the
// countersigning user's own on-file signature image when they have one,
// falling back to their typed name otherwise.
export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.paymentView);
  if (rateLimitResult) return rateLimitResult;

  const { orderId } = await params;
  const body = await request.json().catch(() => null);
  const agentId = typeof body?.agentId === 'string' ? body.agentId.trim() : '';
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  const result = await stampCountersignedHandover(orderId, agentId);

  if ('ok' in result && !result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json(result);
}
