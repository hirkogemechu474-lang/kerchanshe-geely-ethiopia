import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { sign } from 'jsonwebtoken';
import { isPublicRole } from '@/lib/auth/types';

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

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Only customer/dealer accounts may use this endpoint — every staff role
    // belongs on the admin login instead. An allowlist here is safer than a
    // hardcoded staff blocklist, which previously named only 3 of the 8
    // staff roles and let the rest (sales, service, marketing, service
    // advisor/manager) slip through onto the public portal.
    if (!isPublicRole(user.role)) {
      return NextResponse.json(
        { error: 'Please use the admin login page' },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Issue a simple JWT for the public portal
    const token = sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    // Set cookie
    response.cookies.set('customer-token', token, {
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
