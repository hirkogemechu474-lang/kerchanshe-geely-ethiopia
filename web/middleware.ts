import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware
 *
 * Runs at the edge on every matching request. Handles:
 *   1. URL redirect management — 301/302 redirects for retired/renamed model slugs.
 *      Reads from the Redirect table via the /api/redirects/list internal endpoint,
 *      cached in-memory so normal navigations never pay a per-request DB round trip.
 *   2. (Future) Auth guard for admin routes can be added here.
 *
 * NOTE: Middleware cannot use Prisma directly (Edge Runtime).
 *       Redirects are resolved via an internal API call, cached with a TTL.
 */

type RedirectEntry = { id: string; toPath: string; statusCode: number };

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: Map<string, RedirectEntry> | null = null;
let cacheExpiresAt = 0;
let refreshing: Promise<void> | null = null;

async function fetchRedirects(origin: string): Promise<Map<string, RedirectEntry>> {
  const res = await fetch(`${origin}/api/redirects/list`, {
    headers: { 'x-middleware-check': '1' },
  });
  if (!res.ok) return new Map();

  const data = await res.json() as {
    redirects: Array<{ id: string; fromPath: string; toPath: string; statusCode: number }>;
  };

  return new Map(data.redirects.map((r) => [r.fromPath, { id: r.id, toPath: r.toPath, statusCode: r.statusCode }]));
}

function refreshCache(origin: string) {
  if (refreshing) return;
  refreshing = fetchRedirects(origin)
    .then((map) => {
      cache = map;
      cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    })
    .catch(() => {
      // Keep serving the stale cache (or empty map) if the refresh fails.
    })
    .finally(() => {
      refreshing = null;
    });
}

function reportHit(origin: string, id: string) {
  fetch(`${origin}/api/redirects/hit`, {
    method: 'POST',
    headers: { 'x-middleware-check': '1', 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  }).catch(() => {});
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip non-page assets ────────────────────────────────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.') // static files (css, js, png, etc.)
  ) {
    return NextResponse.next();
  }

  const origin = request.nextUrl.origin;

  if (!cache) {
    // Cold start: block once so the very first request still gets a correct answer.
    cache = await fetchRedirects(origin).catch(() => new Map());
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  } else if (Date.now() > cacheExpiresAt) {
    // Serve the (slightly) stale cache for this request; refresh in the background.
    refreshCache(origin);
  }

  const match = cache.get(pathname);
  if (match) {
    reportHit(origin, match.id);

    const redirectUrl = new URL(match.toPath, request.url);
    // Preserve any query params from the original request
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(redirectUrl, { status: match.statusCode || 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|uploads|sw.js|manifest.json).*)',
  ],
};
