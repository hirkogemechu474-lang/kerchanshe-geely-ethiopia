import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/services/auth/passwordResetService';

// Rate limiting storage (in-memory - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); // 15 minutes
    return true;
  }

  if (limit.count >= 3) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting: 3 attempts per 15 minutes
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Security: Don't reveal if user exists or not — always return success,
    // but only send email if user exists.
    await requestPasswordReset(email);

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, an OTP has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
