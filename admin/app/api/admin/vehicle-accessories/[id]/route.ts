import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET - single accessory
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const accessory = await prisma.vehicleAccessory.findUnique({ where: { id } });
    if (!accessory) return NextResponse.json({ success: false, error: 'Accessory not found' }, { status: 404 });
    return NextResponse.json({ success: true, accessory });
  } catch (error) {
    console.error('Error fetching vehicle accessory:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle accessory' }, { status: 500 });
  }
}

// PUT - update an accessory
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const accessory = await prisma.vehicleAccessory.update({
      where: { id },
      data: {
        ...(body.vehicleId !== undefined && { vehicleId: body.vehicleId || null }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.price !== undefined && { price: Number(body.price) || 0 }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
        ...(body.inStock !== undefined && { inStock: Boolean(body.inStock) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
      },
    });

    return NextResponse.json({ success: true, accessory });
  } catch (error) {
    console.error('Error updating vehicle accessory:', error);
    return NextResponse.json({ success: false, error: 'Failed to update vehicle accessory' }, { status: 500 });
  }
}

// DELETE - remove an accessory
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    await prisma.vehicleAccessory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle accessory:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete vehicle accessory' }, { status: 500 });
  }
}
