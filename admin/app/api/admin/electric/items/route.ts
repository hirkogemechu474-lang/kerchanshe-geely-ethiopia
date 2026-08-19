import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all items
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const items = await prisma.electricItem.findMany({
      include: {
        section: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        page: {
          select: {
            id: true,
            slug: true,
            isPublished: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST - Create new item
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const {
      sectionId,
      title,
      description,
      icon,
      image,
      url,
      displayOrder,
      isActive,
      isFeatured,
    } = body;

    if (!sectionId || !title) {
      return NextResponse.json(
        { error: 'Section ID and title are required' },
        { status: 400 }
      );
    }

    const item = await prisma.electricItem.create({
      data: {
        sectionId,
        title,
        description,
        icon,
        image,
        url,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
