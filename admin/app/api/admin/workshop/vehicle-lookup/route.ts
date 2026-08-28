import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { lookupVehicle } from '@/lib/services/workshop/vehicleLookupService';

// UC-04 / FR-201: "look up a vehicle by plate or VIN and see its full
// service history". Phase 6 — first real implementation; previously every
// job card started from a blank form with no lookup at all.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const vin = searchParams.get('vin')?.trim();
  const plate = searchParams.get('plate')?.trim();

  if (!vin && !plate) {
    return NextResponse.json({ error: 'vin or plate is required' }, { status: 400 });
  }

  const result = await lookupVehicle(vin, plate);

  return NextResponse.json(result);
}
