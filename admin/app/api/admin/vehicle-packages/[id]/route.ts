import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET - single package
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const pkg = await vehicleRepository.findPackageById(id);
    if (!pkg) return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error fetching vehicle package:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle package' }, { status: 500 });
  }
}

// PUT - update a package
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const pkg = await vehicleRepository.updatePackage(id, {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.features !== undefined && { features: Array.isArray(body.features) ? body.features : [] }),
      ...(body.price !== undefined && { price: Number(body.price) || 0 }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Package not found' }, { status: 404 });
    }
    console.error('Error updating vehicle package:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vehicle package' }, { status: 500 });
  }
}

// DELETE - remove a package
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    await vehicleRepository.deletePackage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle package:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle package' }, { status: 500 });
  }
}
