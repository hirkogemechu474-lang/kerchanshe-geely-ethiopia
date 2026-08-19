import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch parts page content (the single record)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let content = await prisma.partsPageContent.findFirst();
    if (!content) {
      content = await prisma.partsPageContent.create({ data: {} });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching parts content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// PUT - Update parts page content
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let content = await prisma.partsPageContent.findFirst();
    if (!content) {
      content = await prisma.partsPageContent.create({ data: body });
    } else {
      content = await prisma.partsPageContent.update({
        where: { id: content.id },
        data: body,
      });
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error updating parts content:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}