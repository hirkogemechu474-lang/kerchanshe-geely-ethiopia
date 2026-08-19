import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Security: Don't reveal if user exists or not
    // Always return success, but only send email if user exists
    if (user) {
      // Generate 6-digit OTP
      const otpCode = generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save OTP to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode,
          otpExpiry,
        },
      });

      // Send email with OTP
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
          to: email,
          subject: 'Password Reset OTP - Geely Ethiopia',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #003d7a; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 5px; margin: 20px 0; }
                .otp-box { background: white; border: 2px dashed #003d7a; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: #003d7a; }
                .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
                .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                  <h2>Hello,</h2>
                  <p>We received a request to reset your password for your Geely Ethiopia account.</p>
                  <p>Your One-Time Password (OTP) is:</p>
                  <div class="otp-box">${otpCode}</div>
                  <p><strong>This OTP will expire in 15 minutes.</strong></p>
                  <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>Never share this OTP with anyone</li>
                      <li>Geely Ethiopia staff will never ask for your OTP</li>
                      <li>If you didn't request this, please ignore this email</li>
                    </ul>
                  </div>
                  <p>To reset your password, enter this OTP on the password reset page.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Geely Ethiopia | Kerchanshe Group</p>
                  <p>This is an automated message, please do not reply to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
Password Reset Request

Hello,

We received a request to reset your password for your Geely Ethiopia account.

Your One-Time Password (OTP) is: ${otpCode}

This OTP will expire in 15 minutes.

Security Notice:
- Never share this OTP with anyone
- Geely Ethiopia staff will never ask for your OTP
- If you didn't request this, please ignore this email

To reset your password, enter this OTP on the password reset page.

© ${new Date().getFullYear()} Geely Ethiopia | Kerchanshe Group
This is an automated message, please do not reply to this email.
          `,
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't reveal email sending failure to user for security
      }
    }

    // Always return success (security best practice)
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
