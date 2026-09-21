import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // `api` excluded here (matching the early-return this function already
  // does for pathname.startsWith('/api')) because Next.js buffers the
  // request body when middleware runs, capped at a 10MB default
  // (middlewareClientMaxBodySize) — even though this middleware never reads
  // the body itself. /api/upload receives hero videos (14-20MB+) via a
  // multipart body; letting middleware run on it silently truncated that
  // body past 10MB, corrupting the multipart payload before the actual
  // upload route ever saw it ("Invalid upload request").
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|uploads|api|sw.js|manifest.json).*)',
  ],
};
