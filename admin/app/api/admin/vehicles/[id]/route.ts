import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { updateVehicle, deleteVehicle } from '@/lib/services/vehicles/vehicleService';

/**
 * GET /api/admin/vehicles/[id]
 * Get a single vehicle by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const vehicle = await vehicleRepository.findByIdWithDetail(id);

    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/vehicles/[id]
 * Update a vehicle
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const vehicle = await updateVehicle(id, body);

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vehicles/[id]
 * Delete a vehicle
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const result = await deleteVehicle(id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}
