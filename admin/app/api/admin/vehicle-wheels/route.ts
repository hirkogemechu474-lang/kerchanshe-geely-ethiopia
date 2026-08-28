import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';

// GET /api/admin/vehicle-wheels?vehicleId=xxx
// Returns wheels scoped to this vehicle PLUS global ones (vehicleId null),
// matching the same OR logic the public configuration API uses.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const vehicleId = request.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ success: false, error: 'vehicleId is required' }, { status: 400 });
  }

  try {
    const wheels = await vehicleRepository.findWheels(vehicleId);
    return NextResponse.json({ success: true, wheels });
  } catch (error) {
    console.error('Error fetching vehicle wheels:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vehicle wheels' }, { status: 500 });
  }
}

// POST - Create a wheel option (vehicle-specific, or global when vehicleId is omitted)
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    if (!body.name || !body.size) {
      return NextResponse.json({ success: false, error: 'name and size are required' }, { status: 400 });
    }

    const wheel = await vehicleRepository.createWheel({
      vehicleId: body.vehicleId || null,
      name: body.name,
      size: body.size,
      imageUrl: body.imageUrl || null,
      price: Number(body.price) || 0,
      isDefault: Boolean(body.isDefault),
      inStock: body.inStock !== false,
      sortOrder: Number(body.sortOrder) || 0,
    });

    return NextResponse.json({ success: true, wheel });
  } catch (error) {
    console.error('Error creating vehicle wheel:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vehicle wheel' }, { status: 500 });
  }
}
