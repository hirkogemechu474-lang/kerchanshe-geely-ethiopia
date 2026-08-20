import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// GET /api/admin/vehicle-accessories?vehicleId=xxx
// Returns accessories scoped to this vehicle PLUS global ones (vehicleId null),
// matching the same OR logic the public configuration API uses.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });
  }

  try {
    const accessories = await prisma.vehicleAccessory.findMany({
      where: { OR: [{ vehicleId }, { vehicleId: null }] },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ success: true, accessories });
  } catch (error) {
    console.error('Error fetching vehicle accessories:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle accessories' }, { status: 500 });
  }
}

// POST - Create an accessory (vehicle-specific, or global when vehicleId is omitted)
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    if (!body.name || !body.category || body.price === undefined) {
      return NextResponse.json(
        { success: false, error: 'name, category, and price are required' },
        { status: 400 }
      );
    }

    const accessory = await prisma.vehicleAccessory.create({
      data: {
        vehicleId: body.vehicleId || null,
        name: body.name,
        description: body.description || null,
        category: body.category,
        price: Number(body.price) || 0,
        imageUrl: body.imageUrl || null,
        inStock: body.inStock !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });

    return NextResponse.json({ success: true, accessory });
  } catch (error) {
    console.error('Error creating vehicle accessory:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vehicle accessory' }, { status: 500 });
  }
}
