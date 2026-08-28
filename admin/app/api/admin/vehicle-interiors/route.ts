import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET /api/admin/vehicle-interiors?vehicleId=xxx
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });
  }

  try {
    const interiors = await vehicleRepository.findInteriors(vehicleId);
    return NextResponse.json({ success: true, interiors });
  } catch (error) {
    console.error('Error fetching vehicle interiors:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle interiors' }, { status: 500 });
  }
}

// POST - Create an interior option for a vehicle
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    if (!body.vehicleId || !body.name || !body.materialType) {
      return NextResponse.json(
        { success: false, error: 'vehicleId, name, and materialType are required' },
        { status: 400 }
      );
    }

    const interior = await vehicleRepository.createInterior({
      vehicleId: body.vehicleId,
      name: body.name,
      description: body.description || null,
      materialType: body.materialType,
      imageUrl: body.imageUrl || null,
      price: Number(body.price) || 0,
      isDefault: Boolean(body.isDefault),
      inStock: body.inStock !== false,
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, interior });
  } catch (error) {
    console.error('Error creating vehicle interior:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vehicle interior' }, { status: 500 });
  }
}
