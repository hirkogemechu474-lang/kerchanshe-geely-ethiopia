import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all pages
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const pages = await prisma.electricMenuPage.findMany({
      include: {
        item: {
          include: {
            section: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST - Create new page
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const {
      itemId,
      title,
      slug,
      excerpt,
      content,
      heroImage,
      heroVideo,
      metaTitle,
      metaDescription,
      isPublished,
    } = body;

    if (!itemId || !title || !slug) {
      return NextResponse.json(
        { error: 'Item ID, title, and slug are required' },
        { status: 400 }
      );
    }

    // Update the item's pageId first
    await prisma.electricItem.update({
      where: { id: itemId },
      data: { url: `/electric/${slug}` },
    });

    const page = await prisma.electricMenuPage.create({
      data: {
        itemId,
        title,
        slug,
        excerpt,
        content,
        heroImage,
        heroVideo,
        metaTitle,
        metaDescription,
        isPublished: isPublished || false,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
