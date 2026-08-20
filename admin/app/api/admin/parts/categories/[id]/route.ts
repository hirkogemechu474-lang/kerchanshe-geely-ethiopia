import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

// PUT – Update a category
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();

    const data: any = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
      ...(body.displayOrder !== undefined && { displayOrder: parseInt(body.displayOrder) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    };

    if (body.slug) {
      data.slug = body.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const category = await prisma.partCategory.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE – Delete a category
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    await prisma.partCategory.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}