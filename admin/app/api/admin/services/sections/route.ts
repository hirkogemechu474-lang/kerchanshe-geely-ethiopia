import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - List all service sections
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const sections = await prisma.serviceSection.findMany({
      include: {
        items: {
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
    console.error('Error fetching service sections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service sections' },
      { status: 500 }
    );
  }
}

// POST - Create new service section
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const section = await prisma.serviceSection.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description || null,
        iconUrl: body.iconUrl || null,
        isActive: body.isActive !== false,
        displayOrder: body.displayOrder || 0,
      },
    });

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    console.error('Error creating service section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create service section' },
      { status: 500 }
    );
  }
}
