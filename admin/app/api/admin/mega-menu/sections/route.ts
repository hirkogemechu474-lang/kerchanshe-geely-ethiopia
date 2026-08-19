import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all menu sections
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const sections = await prisma.megaMenuSection.findMany({
      include: {
        categories: {
          include: {
            items: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      sections,
    });
  } catch (error) {
    console.error('Error fetching menu sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu sections' },
      { status: 500 }
    );
  }
}

// POST - Create new menu section
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const section = await prisma.megaMenuSection.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        isActive: body.isActive !== false,
        displayOrder: body.displayOrder || 0,
      },
    });

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    console.error('Error creating menu section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create menu section' },
      { status: 500 }
    );
  }
}
