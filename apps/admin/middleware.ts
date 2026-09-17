import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Origins allowed to load /uploads cross-origin (the web app's 360° viewer
// draws these onto a <canvas> with crossOrigin="anonymous", which requires
// an explicit CORS header even though the files are public). Configured via
// CORS_ORIGINS in .env — falls back to localhost dev origins if unset.
const FALLBACK_DEV_ORIGINS = ['http://localhost:7501', 'http://127.0.0.1:7501', 'https://www.geelyauto.co.za'];

function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : FALLBACK_DEV_ORIGINS;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/uploads/')) {
    // Rewritten (not just passed through) to
    // app/internal-uploads/[...path]/route.ts — see that file for why: Next
    // always prefers a public/uploads/ static file over an app route at the
    // same /uploads path, which silently made a route registered at
    // /uploads itself dead code. Rewriting to a differently-named path
    // sidesteps that collision while keeping the public-facing URL
    // unchanged. (Not /_uploads — a leading underscore makes Next treat a
    // folder as private and exclude it from routing entirely, which was
    // the first version of this fix and silently never matched anything.)
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = `/internal-uploads${pathname.slice('/uploads'.length)}`;
    const response = NextResponse.rewrite(rewritten);
    const origin = request.headers.get('origin');
    if (origin && allowedOrigins().includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Vary', 'Origin');
    }
    return response;
  }

  // This middleware runs for all admin routes except login and unauthorized
  const isLoginPage = pathname === '/admin/login';
  const isUnauthorizedPage = pathname === '/admin/unauthorized';

  // Allow login and unauthorized pages without checks
  if (isLoginPage || isUnauthorizedPage) {
    return NextResponse.next();
  }

  // Session validity itself is checked server-side per page (see
  // lib/auth/middleware.ts getSession(), which calls the backend's
  // requireAdminApiSession) rather than here — the backend is the only
  // place that verifies the next-auth.session-token JWT, and middleware
  // can't easily share that check without duplicating it (jsonwebtoken's
  // verify() needs the Node runtime; Next.js middleware runs on the edge
  // runtime by default). An invalid/expired cookie just makes getSession()
  // return null, which requireAuth()/requirePermission() already redirect
  // to /admin/login for — a stale cookie stops mattering the moment that
  // happens, it just isn't proactively deleted.
  // For all other admin pages, let the page component handle auth
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/uploads/:path*'],
};
