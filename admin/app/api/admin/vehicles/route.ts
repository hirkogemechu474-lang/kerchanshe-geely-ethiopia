import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listVehiclesForAdmin, createVehicle } from '@/lib/services/vehicles/vehicleService';

/**
 * GET /api/admin/vehicles
 * Get all vehicles with optional filters, search, and pagination
 */
export async function GET(request: Request) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const result = await listVehiclesForAdmin({
      page,
      limit,
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      category: searchParams.get('category'),
      brand: searchParams.get('brand'),
      featured: searchParams.get('featured'),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vehicles
 * Create a new vehicle
 */
export async function POST(request: Request) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const vehicle = await createVehicle(body);

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
