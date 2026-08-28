import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/middleware';
import { allocateVehicle, releaseVehicleAllocation } from '@/lib/services/sales/vehicleAllocationService';

type Context = { params: Promise<{ id: string }> };

/** Reserve or update the vehicle allocated to an order. */
export async function PUT(request: Request, { params }: Context) {
  const session = await requirePermission('canManageVehicles');
  const { id: orderId } = await params;
  const body = await request.json().catch(() => ({}));
  const vehicleId = String(body.vehicleId || '');
  const vin = body.vin ? String(body.vin).trim() : null;

  if (!vehicleId) {
    return NextResponse.json({ error: 'vehicleId is required.' }, { status: 400 });
  }

  const result = await allocateVehicle(orderId, vehicleId, vin, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ success: true, allocation: result.allocation });
}

/** Release a reservation and return the unit to stock. */
export async function DELETE(_request: Request, { params }: Context) {
  const session = await requirePermission('canManageVehicles');
  const { id: orderId } = await params;

  const result = await releaseVehicleAllocation(orderId, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ success: true, allocation: result.allocation });
}
