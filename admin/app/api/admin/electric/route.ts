import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET - List all electric pages
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const includeStations = searchParams.get('includeStations') === 'true';

    const pages = await prisma.electricPage.findMany({
      orderBy: { displayOrder: 'asc' },
      include: includeStations ? {
        chargingStations: {
          orderBy: { name: 'asc' },
        },
      } : undefined,
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching electric pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  } 
}

// POST - Create new electric page
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const {
      title,
      slug,
      pageType,
      heroTitle,
      heroSubtitle,
      heroImage,
      content,
      sections,
      metadata,
      isPublished,
      displayOrder,
    } = body;

    if (!title || !slug || !pageType) {
      return NextResponse.json(
        { error: 'Title, slug, and page type are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPage = await prisma.electricPage.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 400 }
      );
    }

    const page = await prisma.electricPage.create({
      data: {
        title,
        slug,
        pageType,
        heroTitle,
        heroSubtitle,
        heroImage,
        content,
        sections,
        metadata,
        isPublished: isPublished ?? false,
        displayOrder: displayOrder ?? 0,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Error creating electric page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  } 
}
