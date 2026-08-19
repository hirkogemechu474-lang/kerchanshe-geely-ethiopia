import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.redirect(
    new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000')
  );

  // Clear the customer session cookie
  response.cookies.set('customer-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
