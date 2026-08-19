import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - Get single section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const section = await prisma.megaMenuSection.findUnique({
      where: { id: id },
      include: {
        categories: {
          include: {
            items: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { success: false, error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PUT - Update section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const body = await request.json();

    const section = await prisma.megaMenuSection.update({
      where: { id: id },
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
    console.error('Error updating section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE - Delete section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    await prisma.megaMenuSection.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
