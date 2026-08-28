import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { loginCustomer } from '@/lib/services/auth/loginService';

export async function POST(request: NextRequest) {
  // Rate limit in production only
  if (process.env.NODE_ENV !== 'development') {
    const rateLimitResult = await rateLimit(request, rateLimitConfigs.login);
    if (rateLimitResult) return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await loginCustomer(email, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    // Set cookie
    response.cookies.set('customer-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
