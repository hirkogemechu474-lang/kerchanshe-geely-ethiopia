import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET /api/admin/vehicle-packages?vehicleId=xxx
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });
  }

  try {
    const packages = await prisma.vehiclePackage.findMany({
      where: { vehicleId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching vehicle packages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle packages' }, { status: 500 });
  }
}

// POST - Create a trim/package for a vehicle
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    if (!body.vehicleId || !body.name) {
      return NextResponse.json({ success: false, error: 'vehicleId and name are required' }, { status: 400 });
    }

    const pkg = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.vehiclePackage.updateMany({
          where: { vehicleId: body.vehicleId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.vehiclePackage.create({
        data: {
          vehicleId: body.vehicleId,
          name: body.name,
          description: body.description || null,
          features: Array.isArray(body.features) ? body.features : [],
          price: Number(body.price) || 0,
          imageUrl: body.imageUrl || null,
          isDefault: Boolean(body.isDefault),
          sortOrder: Number(body.sortOrder) || 0,
        },
      });
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error('Error creating vehicle package:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vehicle package' }, { status: 500 });
  }
}
