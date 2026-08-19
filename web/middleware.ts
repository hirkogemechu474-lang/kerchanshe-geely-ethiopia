import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware
 *
 * Runs at the edge on every matching request. Handles:
 *   1. URL redirect management — 301/302 redirects for retired/renamed model slugs.
 *      Reads from the Redirect table via the /api/redirects/check internal endpoint.
 *   2. (Future) Auth guard for admin routes can be added here.
 *
 * NOTE: Middleware cannot use Prisma directly (Edge Runtime).
 *       Redirects are resolved via an internal API call.
 */
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

  // ── Check redirect table for this path ─────────────────────────────────────
  try {
    const baseUrl = request.nextUrl.origin;
    const checkUrl = `${baseUrl}/api/redirects/check?path=${encodeURIComponent(pathname)}`;

    const response = await fetch(checkUrl, {
      headers: { 'x-middleware-check': '1' },
    });

    if (response.ok) {
      const data = await response.json() as {
        redirect: boolean;
        toPath?: string;
        statusCode?: number;
      };

      if (data.redirect && data.toPath) {
        const redirectUrl = new URL(data.toPath, request.url);
        // Preserve any query params from the original request
        request.nextUrl.searchParams.forEach((value, key) => {
          redirectUrl.searchParams.set(key, value);
        });

        return NextResponse.redirect(redirectUrl, {
          status: data.statusCode || 301,
        });
      }
    }
  } catch {
    // Silently continue if the redirect check fails — never block the user
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|uploads|sw.js|manifest.json).*)',
  ],
};
