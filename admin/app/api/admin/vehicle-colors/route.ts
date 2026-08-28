import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET /api/admin/vehicle-colors?vehicleId=xxx
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });
  }

  try {
    const colors = await vehicleRepository.findColors(vehicleId);
    return NextResponse.json({ success: true, colors });
  } catch (error) {
    console.error('Error fetching vehicle colors:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle colors' }, { status: 500 });
  }
}

// POST - Create a color for a vehicle
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    if (!body.vehicleId || !body.name || !body.colorCode) {
      return NextResponse.json(
        { success: false, error: 'vehicleId, name, and colorCode are required' },
        { status: 400 }
      );
    }

    const color = await vehicleRepository.createColor({
      vehicleId: body.vehicleId,
      name: body.name,
      colorCode: body.colorCode,
      imageUrl: body.imageUrl || null,
      price: Number(body.price) || 0,
      inStock: body.inStock !== false,
      isDefault: Boolean(body.isDefault),
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, color });
  } catch (error) {
    console.error('Error creating vehicle color:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vehicle color' }, { status: 500 });
  }
}
