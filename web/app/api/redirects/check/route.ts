import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/redirects/check?path=/models/old-slug
 *
 * Internal endpoint called by middleware to check if a URL path
 * has a configured redirect in the database.
 *
 * Only accessible from middleware (checked via x-middleware-check header).
 */
export async function GET(request: NextRequest) {
  // Security: only callable from our own middleware
  const isMiddlewareCall = request.headers.get('x-middleware-check') === '1';
  if (!isMiddlewareCall) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ redirect: false });
  }

  try {
    const redirect = await prisma.redirect.findFirst({
      where: {
        fromPath: path,
        isActive: true,
      },
      select: {
        toPath: true,
        statusCode: true,
        id: true,
      },
    });

    if (!redirect) {
      return NextResponse.json({ redirect: false });
    }

    // Increment hit count (fire-and-forget — don't await to avoid slowing requests)
    prisma.redirect
      .update({
        where: { id: redirect.id },
        data: { hitCount: { increment: 1 } },
      })
      .catch(() => {}); // Silently ignore if this fails

    return NextResponse.json({
      redirect: true,
      toPath: redirect.toPath,
      statusCode: redirect.statusCode,
    });
  } catch (err) {
    console.error('[redirects/check] DB error:', err);
    // On DB error, don't block the request — return no redirect
    return NextResponse.json({ redirect: false });
  }
}
