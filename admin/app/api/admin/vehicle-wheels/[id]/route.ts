import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - single wheel option
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const wheel = await prisma.vehicleWheel.findUnique({ where: { id } });
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

    const wheel = await prisma.$transaction(async (tx) => {
      const existing = await tx.vehicleWheel.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');

      if (body.isDefault) {
        await tx.vehicleWheel.updateMany({
          where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.vehicleWheel.update({
        where: { id },
        data: {
          ...(body.vehicleId !== undefined && { vehicleId: body.vehicleId || null }),
          ...(body.name !== undefined && { name: body.name }),
          ...(body.size !== undefined && { size: body.size }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
          ...(body.price !== undefined && { price: Number(body.price) || 0 }),
          ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
          ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
          ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
        },
      });
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
    await prisma.vehicleWheel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle wheel:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle wheel' }, { status: 500 });
  }
}
