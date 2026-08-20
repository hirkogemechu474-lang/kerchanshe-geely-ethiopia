import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET - List all benefits pages
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const benefits = await prisma.electricPage.findMany({
      where: {
        slug: { in: ['cost-calculator', 'government-incentives', 'environmental-impact'] },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return NextResponse.json({ error: 'Failed to fetch benefits' }, { status: 500 });
  } 
}

// POST - Create benefit page
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const {
      title,
      slug,
      heroTitle,
      heroSubtitle,
      heroImage,
      description,
      isPublished,
      metadata,
    } = body;

    const benefit = await prisma.electricPage.create({
      data: {
        title,
        slug,
        pageType: 'custom',
        heroTitle,
        heroSubtitle,
        heroImage,
        content: description,
        isPublished: isPublished ?? true,
        displayOrder: 10,
        ...(metadata !== undefined && { metadata }),
      },
    });

    return NextResponse.json({ benefit }, { status: 201 });
  } catch (error) {
    console.error('Error creating benefit:', error);
    return NextResponse.json(
      { error: 'Failed to create benefit' },
      { status: 500 }
    );
  } 
}
