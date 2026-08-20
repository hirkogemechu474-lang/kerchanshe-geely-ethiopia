import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id: slug }, { slug }], isActive: true, status: 'published' },
      select: { id: true },
    });

    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const [colors, interiors, packages, accessories, wheels] = await Promise.all([
      prisma.vehicleColor.findMany({ where: { vehicleId: vehicle.id }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehicleInterior.findMany({ where: { vehicleId: vehicle.id }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehiclePackage.findMany({ where: { vehicleId: vehicle.id }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehicleAccessory.findMany({ where: { OR: [{ vehicleId: vehicle.id }, { vehicleId: null }], inStock: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehicleWheel.findMany({ where: { OR: [{ vehicleId: vehicle.id }, { vehicleId: null }], inStock: true }, orderBy: { sortOrder: 'asc' } }),
    ]);

    return NextResponse.json({ colors, interiors, packages, accessories, wheels });
  } catch (error) {
    console.error('Error fetching vehicle configuration:', error);
    return NextResponse.json({ error: 'Failed to load vehicle configuration' }, { status: 500 });
  }
}
