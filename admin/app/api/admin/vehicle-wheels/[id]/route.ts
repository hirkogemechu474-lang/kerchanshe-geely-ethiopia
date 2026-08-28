import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET - single wheel option
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const wheel = await vehicleRepository.findWheelById(id);
    if (!wheel) return NextResponse.json({ success: false, error: 'Wheel option not found' }, { status: 404 });
    return NextResponse.json({ success: true, wheel });
  } catch (error) {
    console.error('Error fetching vehicle wheel:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle wheel' }, { status: 500 });
  }
}

// PUT - update a wheel option
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const wheel = await vehicleRepository.updateWheel(id, {
      ...(body.vehicleId !== undefined && { vehicleId: body.vehicleId || null }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.size !== undefined && { size: body.size }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.price !== undefined && { price: Number(body.price) || 0 }),
      ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
      ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
    });

    return NextResponse.json({ success: true, wheel });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Wheel option not found' }, { status: 404 });
    }
    console.error('Error updating vehicle wheel:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vehicle wheel' }, { status: 500 });
  }
}

// DELETE - remove a wheel option
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    await vehicleRepository.deleteWheel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle wheel:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle wheel' }, { status: 500 });
  }
}
