import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - single interior option
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const interior = await prisma.vehicleInterior.findUnique({ where: { id } });
    if (!interior) return NextResponse.json({ success: false, error: 'Interior option not found' }, { status: 404 });
    return NextResponse.json({ success: true, interior });
  } catch (error) {
    console.error('Error fetching vehicle interior:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle interior' }, { status: 500 });
  }
}

// PUT - update an interior option
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const interior = await prisma.$transaction(async (tx) => {
      const existing = await tx.vehicleInterior.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');

      if (body.isDefault) {
        await tx.vehicleInterior.updateMany({
          where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.vehicleInterior.update({
        where: { id },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description || null }),
          ...(body.materialType !== undefined && { materialType: body.materialType }),
          ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
          ...(body.price !== undefined && { price: Number(body.price) || 0 }),
          ...(body.isDefault !== undefined && { isDefault: Boolean(body.isDefault) }),
          ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
          ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
        },
      });
    });

    return NextResponse.json({ success: true, interior });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return NextResponse.json({ success: false, error: 'Interior option not found' }, { status: 404 });
    }
    console.error('Error updating vehicle interior:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vehicle interior' }, { status: 500 });
  }
}

// DELETE - remove an interior option
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    await prisma.vehicleInterior.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle interior:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle interior' }, { status: 500 });
  }
}
