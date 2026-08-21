import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

// Vehicle-record edits from the Customers admin screen — e.g. fixing a
// mistyped plate, or correcting warranty dates entered wrong at write-up
// time. Job-card creation still derives warranty dates from this record
// (admin/app/api/admin/workshop/job-cards/route.ts), never the other way
// around, so a correction here is reflected on the next visit automatically.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { plateNo, model, trim, color, isNev, warrantyStartDate, warrantyEndDate, mileageLastKnown } = body;

  if (plateNo !== undefined && !plateNo.trim()) {
    return NextResponse.json({ error: 'plateNo cannot be empty' }, { status: 400 });
  }

  try {
    const vehicle = await prisma.customerVehicle.update({
      where: { id },
      data: {
        ...(plateNo !== undefined && { plateNo }),
        ...(model !== undefined && { model: model || null }),
        ...(trim !== undefined && { trim: trim || null }),
        ...(color !== undefined && { color: color || null }),
        ...(isNev !== undefined && { isNev: Boolean(isNev) }),
        ...(warrantyStartDate !== undefined && { warrantyStartDate: warrantyStartDate ? new Date(warrantyStartDate) : null }),
        ...(warrantyEndDate !== undefined && { warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null }),
        ...(mileageLastKnown !== undefined && { mileageLastKnown: mileageLastKnown === null ? null : Number(mileageLastKnown) }),
      },
    });
    return NextResponse.json({ vehicle });
  } catch {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }
}
