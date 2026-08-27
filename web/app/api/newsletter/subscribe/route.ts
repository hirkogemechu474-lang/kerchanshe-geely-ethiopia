import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { subscribeToNewsletter } from '@/lib/services/newsletter/newsletterService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const result = await subscribeToNewsletter(email);

    if (result.alreadySubscribed) {
      return NextResponse.json({ message: 'You are already subscribed. Thank you!' });
    }

    return NextResponse.json(
      { message: 'Thank you for subscribing to the Geely Ethiopia newsletter!', emailSent: result.emailSent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
  }
}
