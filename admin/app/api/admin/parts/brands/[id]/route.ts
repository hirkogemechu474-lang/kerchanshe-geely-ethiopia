import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { updateBrand, deleteBrand } from '@/lib/services/parts/partsContentService';

type Params = Promise<{ id: string }>;

// PUT – Update a brand
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const brand = await updateBrand(id, body);

    return NextResponse.json({ brand });
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

// DELETE – Delete a brand
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    await deleteBrand(id);

    return NextResponse.json({ message: 'Brand deleted' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
