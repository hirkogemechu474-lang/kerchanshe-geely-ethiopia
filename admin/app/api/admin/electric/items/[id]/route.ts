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
    const item = await prisma.electricItem.findUnique({
      where: { id: id },
      include: {
        section: true,
        page: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
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

    const item = await prisma.electricItem.update({
      where: { id: id },
      data: {
        sectionId,
        title,
        description,
        icon,
        image,
        url,
        displayOrder,
        isActive,
        isFeatured,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
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
    await prisma.electricItem.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
