import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Rate limiting storage (in-memory - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour
    return true;
  }

  if (limit.count >= 5) {
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Rate limiting: 5 attempts per hour
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again in 1 hour.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, otp, newPassword } = body;

    // Validate inputs
    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user with matching email and OTP
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        otpCode: otp,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid OTP or email' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      // Clear expired OTP
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: null,
          otpExpiry: null,
        },
      });

      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
