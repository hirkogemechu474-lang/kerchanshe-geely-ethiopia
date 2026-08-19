import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const item = await prisma.serviceItem.findUnique({
      where: { id: id },
      include: {
        section: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

// PUT - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    const body = await request.json();

    const item = await prisma.serviceItem.update({
      where: { id: id },
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
    console.error('Error updating item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;try {
    await prisma.serviceItem.delete({
      where: { id: id },
    });

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
