import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { sendFormEmail } from '@/lib/form-email';

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

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (category && category !== 'all') {
      where.category = category;
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

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

    const message = await prisma.message.create({
      data: {
        from: data.name || data.from || 'Website visitor',
        email: data.email,
        subject: data.subject || 'Website enquiry',
        category: data.category || data.type || 'General',
        content: data.message || data.content || '',
        status: 'unread',
        priority: data.priority || 'medium',
      },
    });

    let notificationSent = false;
    try {
      notificationSent = await sendFormEmail({
        type: 'message',
        name: data.name || data.from || 'Website visitor',
        email: data.email,
        phone: data.phone,
        subject: data.subject || 'Website enquiry',
        reference: message.id,
        details: data.message || data.content || '',
      });
    } catch (emailError) {
      console.error('[message:email]', emailError);
    }

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
