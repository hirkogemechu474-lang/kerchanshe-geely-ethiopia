import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Origins allowed to load /uploads cross-origin (the web app's 360° viewer
// draws these onto a <canvas> with crossOrigin="anonymous", which requires
// an explicit CORS header even though the files are public). Configured via
// CORS_ORIGINS in .env — falls back to localhost dev origins if unset.
const FALLBACK_DEV_ORIGINS = ['http://localhost:7501', 'http://127.0.0.1:7501'];

function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : FALLBACK_DEV_ORIGINS;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/uploads/')) {
    const response = NextResponse.next();
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

  // For all other admin pages, let the page component handle auth
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/uploads/:path*'],
};
