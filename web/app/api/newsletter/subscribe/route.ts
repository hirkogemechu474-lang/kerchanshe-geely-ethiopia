import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendNewsletterEmail(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (process.env.SMTP_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[newsletter] SMTP is not configured; email skipped');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = `"${process.env.SMTP_FROM_NAME || 'Geely Ethiopia'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to: email,
    subject: 'Welcome to the Geely Ethiopia Newsletter',
    text:
      "Hello,\n\nThank you for subscribing to the Geely Ethiopia newsletter. You'll receive updates on our latest models, special offers, and news.\n\nBest regards,\nGeely Ethiopia",
  });

  if (adminEmail) {
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: 'New newsletter subscriber',
      text: `A new subscriber joined the newsletter:\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
    });
  }
  return true;
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.contactForm);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  let email: string;
  try {
    const body = await request.json();
    email = typeof body?.email === 'string' ? body.email.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
  }

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing && existing.status === 'subscribed') {
      return NextResponse.json({ message: 'You are already subscribed. Thank you!' });
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { status: 'subscribed' },
      create: { email, source: 'website' },
    });

    let emailSent = false;
    try {
      emailSent = await sendNewsletterEmail(email);
    } catch (error) {
      console.error('[newsletter:email]', error);
    }

    return NextResponse.json(
      { message: 'Thank you for subscribing to the Geely Ethiopia newsletter!', emailSent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
  }
}