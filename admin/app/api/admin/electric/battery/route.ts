import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/electric/battery
 * Get battery page content
 */
export async function GET() {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!session!.user.permissions.canManageSettings) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const page = await prisma.electricPage.findUnique({
      where: { slug: 'battery' }
    });

    if (!page) {
      return NextResponse.json(
        { error: 'Battery page not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const sections = JSON.parse(page.sections as string);
    const metadata = JSON.parse(page.metadata as string);

    return NextResponse.json({
      ...page,
      sections,
      faqs: metadata.faqs || []
    });

  } catch (error) {
    console.error('Error fetching battery page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/electric/battery
 * Update battery page content
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!session!.user.permissions.canManageSettings) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { heroTitle, heroSubtitle, heroImage, content, sections, faqs, isPublished } = body;

    // Validate required fields
    if (!heroTitle || !sections) {
      return NextResponse.json(
        { error: 'Hero title and sections are required' },
        { status: 400 }
      );
    }

    // Ensure sections is an array with 10 items
    if (!Array.isArray(sections) || sections.length !== 10) {
      return NextResponse.json(
        { error: '10 sections are required' },
        { status: 400 }
      );
    }

    // Upsert the battery page
    const page = await prisma.electricPage.upsert({
      where: { slug: 'battery' },
      create: {
        title: 'Battery & Warranty',
        slug: 'battery',
        pageType: 'custom',
        heroTitle,
        heroSubtitle: heroSubtitle || '',
        heroImage: heroImage || null,
        content: content || '',
        sections: JSON.stringify(sections),
        metadata: JSON.stringify({ faqs: faqs || [] }),
        isPublished: isPublished ?? true,
        displayOrder: 1
      },
      update: {
        heroTitle,
        heroSubtitle: heroSubtitle || '',
        heroImage: heroImage || null,
        content: content || '',
        sections: JSON.stringify(sections),
        metadata: JSON.stringify({ faqs: faqs || [] }),
        isPublished: isPublished ?? true
      }
    });

    return NextResponse.json({
      message: 'Battery page updated successfully',
      page
    });

  } catch (error) {
    console.error('Error updating battery page:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
