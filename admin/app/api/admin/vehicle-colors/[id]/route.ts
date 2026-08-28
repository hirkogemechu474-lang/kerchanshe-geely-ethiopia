import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET - single color
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const color = await vehicleRepository.findColorById(id);
    if (!color) return NextResponse.json({ success: false, error: 'Color not found' }, { status: 404 });
    return NextResponse.json({ success: true, color });
  } catch (error) {
    console.error('Error fetching vehicle color:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle color' }, { status: 500 });
  }
}

// PUT - update a color
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const color = await vehicleRepository.updateColor(id, {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.colorCode !== undefined && { colorCode: body.colorCode }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.price !== undefined && { price: Number(body.price) || 0 }),
      ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
      ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
    });

    return NextResponse.json({ success: true, color });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Color not found' }, { status: 404 });
    }
    console.error('Error updating vehicle color:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vehicle color' }, { status: 500 });
  }
}

// DELETE - remove a color
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    await vehicleRepository.deleteColor(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle color:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle color' }, { status: 500 });
  }
}
