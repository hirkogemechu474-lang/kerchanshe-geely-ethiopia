import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { updateCategory, deleteCategory } from '@/lib/services/parts/partsContentService';

type Params = Promise<{ id: string }>;

// PUT – Update a category
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const category = await updateCategory(id, body);

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE – Delete a category
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    await deleteCategory(id);

    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
