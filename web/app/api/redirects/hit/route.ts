import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/redirects/hit
 *
 * Fire-and-forget hit-count increment for a redirect, called by middleware
 * only when a cached redirect actually matches (rare), so it never sits on
 * the hot path of a normal navigation.
 *
 * Only accessible from middleware (checked via x-middleware-check header).
 */
export async function POST(request: NextRequest) {
  const isMiddlewareCall = request.headers.get('x-middleware-check') === '1';
  if (!isMiddlewareCall) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await request.json().catch(() => ({ id: null }));
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  prisma.redirect
    .update({ where: { id }, data: { hitCount: { increment: 1 } } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
