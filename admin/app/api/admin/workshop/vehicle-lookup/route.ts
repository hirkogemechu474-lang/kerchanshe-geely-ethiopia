import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

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

  const vehicle = await prisma.customerVehicle.findFirst({
    where: vin ? { vin: { equals: vin, mode: 'insensitive' } } : { plateNo: { equals: plate!, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
    include: {
      customer: { select: { id: true, fullName: true, phone: true, email: true } },
      jobCards: {
        orderBy: { openTs: 'desc' },
        take: 10,
        select: {
          id: true,
          jobCardNo: true,
          status: true,
          complaintText: true,
          openTs: true,
          closeTs: true,
        },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    customerVehicle: {
      id: vehicle.id,
      vin: vehicle.vin,
      plateNo: vehicle.plateNo,
      model: vehicle.model,
      trim: vehicle.trim,
      color: vehicle.color,
      isNev: vehicle.isNev,
      warrantyStartDate: vehicle.warrantyStartDate,
      warrantyEndDate: vehicle.warrantyEndDate,
      mileageLastKnown: vehicle.mileageLastKnown,
    },
    customer: vehicle.customer,
    history: vehicle.jobCards,
  });
}
