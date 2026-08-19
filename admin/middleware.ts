import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This middleware runs for all admin routes except login and unauthorized
  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const isUnauthorizedPage = request.nextUrl.pathname === '/admin/unauthorized';
  
  // Allow login and unauthorized pages without checks
  if (isLoginPage || isUnauthorizedPage) {
    return NextResponse.next();
  }
  
  // For all other admin pages, let the page component handle auth
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
