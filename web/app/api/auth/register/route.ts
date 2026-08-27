import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { sendFormEmail } from '@/lib/form-email';

/**
 * POST /api/auth/register
 * Register a new customer account
 * 
 * Note: Admin users should be created through admin panel, not public registration
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
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      city,
      acceptTerms,
      acceptMarketing
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !city) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'You must accept the terms and conditions' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user account
    // Note: Public registration creates a "customer" role entry
    // This is NOT for admin users
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: `${firstName} ${lastName}`,
        passwordHash,
        role: 'customer', // Default role for public registration
        isActive: true,
        // Store additional info in a metadata field if you have one,
        // or create a separate Customer model
      }
    });

    try {
      await sendFormEmail({
        type: 'account registration',
        name: `${firstName} ${lastName}`,
        email: user.email,
        phone,
        subject: `New customer account — ${firstName} ${lastName}`,
        reference: user.id,
        details: `${firstName} ${lastName} created a customer account (${city || 'city not provided'}).`,
      });
    } catch (emailError) {
      console.error('[auth:register:email]', emailError);
    }

    // TODO: If acceptMarketing, add to newsletter list

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      userId: user.id
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
