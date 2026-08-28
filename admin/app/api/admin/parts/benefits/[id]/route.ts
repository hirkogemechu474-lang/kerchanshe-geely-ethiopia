import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { updateBenefit, deleteBenefit } from '@/lib/services/parts/partsContentService';

type Params = Promise<{ id: string }>;

// PUT – Update a benefit
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    const body = await request.json();

    const benefit = await updateBenefit(id, body);

    return NextResponse.json({ benefit });
  } catch (error) {
    console.error('Error updating benefit:', error);
    return NextResponse.json({ error: 'Failed to update benefit' }, { status: 500 });
  }
}

// DELETE – Delete a benefit
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { id } = await params;
    await deleteBenefit(id);

    return NextResponse.json({ message: 'Benefit deleted' });
  } catch (error) {
    console.error('Error deleting benefit:', error);
    return NextResponse.json({ error: 'Failed to delete benefit' }, { status: 500 });
  }
}
