import { NextRequest, NextResponse } from 'next/server';
import { redirectRepository } from '@/repositories/redirectRepository';

/**
 * GET /api/redirects/list
 *
 * Returns every active redirect. Called by middleware to populate its
 * in-memory cache (refreshed on a TTL) instead of doing a DB round trip
 * on every single page navigation.
 *
 * Only accessible from middleware (checked via x-middleware-check header).
 */
export async function GET(request: NextRequest) {
  const isMiddlewareCall = request.headers.get('x-middleware-check') === '1';
  if (!isMiddlewareCall) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const redirects = await redirectRepository.findActive();

    return NextResponse.json({ redirects });
  } catch (err) {
    console.error('[redirects/list] DB error:', err);
    return NextResponse.json({ redirects: [] });
  }
}
