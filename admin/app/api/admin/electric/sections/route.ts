import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all sections
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const sections = await prisma.electricSection.findMany({
      include: {
        items: {
          orderBy: {
            displayOrder: 'asc',
          },
          include: {
            page: {
              select: {
                id: true,
                slug: true,
                isPublished: true,
              },
            },
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST - Create new section
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const { title, slug, description, icon, displayOrder, isActive } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const section = await prisma.electricSection.create({
      data: {
        title,
        slug,
        description,
        icon,
        displayOrder: displayOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
