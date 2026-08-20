import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - single package
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const pkg = await prisma.vehiclePackage.findUnique({ where: { id } });
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

    const pkg = await prisma.$transaction(async (tx) => {
      const existing = await tx.vehiclePackage.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');

      if (body.isDefault) {
        await tx.vehiclePackage.updateMany({
          where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.vehiclePackage.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description || null }),
          ...(body.features !== undefined && { features: Array.isArray(body.features) ? body.features : [] }),
          ...(body.price !== undefined && { price: Number(body.price) || 0 }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
          ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
          ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
        },
      });
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
    await prisma.vehiclePackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle package:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle package' }, { status: 500 });
  }
}
