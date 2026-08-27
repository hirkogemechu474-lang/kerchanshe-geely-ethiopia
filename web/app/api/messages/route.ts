import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { messageRepository } from '@/repositories/messageRepository';
import { submitContactMessage } from '@/lib/services/messages/messageService';

// GET - List all messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.permissions.canViewMessages) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const messages = await messageRepository.findMany({ status, category });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new message (from contact form)
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.contactForm);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const data = await request.json();

    const { message, notificationSent } = await submitContactMessage(data);

    // TODO: Send email notification to admin
    // TODO: Send auto-reply to customer

    return NextResponse.json({ ...message, notificationSent }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
