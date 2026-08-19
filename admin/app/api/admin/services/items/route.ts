import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all service items
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    const where = sectionId ? { sectionId } : {};

    const items = await prisma.serviceItem.findMany({
      where,
      include: {
        section: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error('Error fetching service items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service items' },
      { status: 500 }
    );
  }
}

// POST - Create new service item
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const item = await prisma.serviceItem.create({
      data: {
        sectionId: body.sectionId,
        title: body.title,
        description: body.description || null,
        icon: body.icon || null,
        image: body.image || null,
        url: body.url || null,
        isActive: body.isActive !== false,
        isFeatured: body.isFeatured === true,
        displayOrder: body.displayOrder || 0,
      },
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error creating service item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service item' },
      { status: 500 }
    );
  }
}
