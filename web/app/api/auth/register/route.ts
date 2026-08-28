import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { registerCustomer } from '@/lib/services/auth/registerService';

/**
 * POST /api/auth/register
 * Register a new customer account
 *
 * Note: Admin users should be created through admin panel, not public
 * registration
 */
export async function POST(request: NextRequest) {
  // Rate limit registration attempts
  const rateLimitResult = await rateLimit(request, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 registration attempts per IP
    message: 'Too many registration attempts. Please try again in 15 minutes.'
  });

  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const result = await registerCustomer(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    // TODO: If acceptMarketing, add to newsletter list

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      userId: result.userId
    }, { status: 201 });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Registration failed. Please try again later.' },
      { status: 500 }
    );
  }
}
