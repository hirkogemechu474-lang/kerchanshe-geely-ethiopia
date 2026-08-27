import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextJobCardNo } from '@/lib/services/workshop/jobCardNumber';
import { findBayConflict } from '@/lib/services/workshop/bayConflict';
import type { JobCardStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') as JobCardStatus | null;
  const technicianId = searchParams.get('technicianId');
  const bayId = searchParams.get('bayId');
  const date = searchParams.get('date'); // YYYY-MM-DD, filters by openTs day

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (technicianId) where.technicianId = technicianId;
  if (bayId) where.bayId = bayId;
  if (date) {
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);
    where.openTs = { gte: dayStart, lte: dayEnd };
  }

  const jobCards = await prisma.jobCard.findMany({
    where,
    include: {
      technician: { select: { id: true, name: true } },
      bay: { select: { id: true, name: true, bayType: true } },
    },
    orderBy: { openTs: 'desc' },
    take: 200,
  });

  return NextResponse.json({ jobCards });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      plateNo,
      vin,
      vehicleModel,
      vehicleYear,
      mileage,
      customerName,
      customerPhone,
      customerEmail,
      complaintText,
      technicianId,
      bayId,
      scheduledStart,
      scheduledEnd,
      // Phase 6 — Customer/Vehicle ownership (BRD FR-501, UC-01, UC-04):
      customerVehicleId, // advisor confirmed a vehicle-lookup match
      saveAsNewVehicleRecord, // advisor chose to save this as a new record
      warrantyStartDate,
      warrantyEndDate,
    } = body;

    if (!plateNo || !customerName || !customerPhone || !complaintText) {
      return NextResponse.json(
        { error: 'plateNo, customerName, customerPhone, and complaintText are required' },
        { status: 400 }
      );
    }

    // Resolve vehicle-ownership linkage before creating the job card so its
    // warranty dates can be derived rather than trusted blindly from the
    // client. Two paths only — never an implicit background match, so the
    // advisor is always the one who decided this via the lookup UI.
    let resolvedCustomerVehicleId: string | null = null;
    let resolvedWarrantyStart = warrantyStartDate ? new Date(warrantyStartDate) : null;
    let resolvedWarrantyEnd = warrantyEndDate ? new Date(warrantyEndDate) : null;

    if (customerVehicleId) {
      const matched = await prisma.customerVehicle.findUnique({ where: { id: customerVehicleId } });
      if (!matched) {
        return NextResponse.json({ error: 'Selected vehicle record was not found' }, { status: 400 });
      }
      resolvedCustomerVehicleId = matched.id;
      resolvedWarrantyStart = matched.warrantyStartDate;
      resolvedWarrantyEnd = matched.warrantyEndDate;
    } else if (saveAsNewVehicleRecord) {
      // UC-01 dedupe rule: match an existing customer by phone before
      // creating a duplicate.
      let customer = await prisma.customer.findFirst({ where: { phone: customerPhone } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { fullName: customerName, phone: customerPhone, email: customerEmail || null },
        });
      }
      const newVehicle = await prisma.customerVehicle.create({
        data: {
          customerId: customer.id,
          vin: vin || null,
          plateNo,
          model: vehicleModel || null,
          warrantyStartDate: resolvedWarrantyStart,
          warrantyEndDate: resolvedWarrantyEnd,
        },
      });
      resolvedCustomerVehicleId = newVehicle.id;
    }

    // BR-008: a bay cannot be double-booked for overlapping time windows.
    if (bayId && scheduledStart && scheduledEnd) {
      const conflict = await findBayConflict(bayId, new Date(scheduledStart), new Date(scheduledEnd));
      if (conflict) {
        return NextResponse.json(
          { error: `Bay is already booked for ${conflict.jobCardNo} in this time window` },
          { status: 409 }
        );
      }
    }

    const jobCardNo = await nextJobCardNo();
    const initialStatus = bayId ? 'DRAFT_CHECKIN' : 'AWAITING_BAY';

    const jobCard = await prisma.jobCard.create({
      data: {
        jobCardNo,
        plateNo,
        vin: vin || null,
        vehicleModel: vehicleModel || null,
        vehicleYear: vehicleYear ? Number(vehicleYear) : null,
        mileage: mileage ? Number(mileage) : null,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        complaintText,
        customerVehicleId: resolvedCustomerVehicleId,
        warrantyStartDate: resolvedWarrantyStart,
        warrantyEndDate: resolvedWarrantyEnd,
        technicianId: technicianId || null,
        bayId: bayId || null,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        status: initialStatus,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: initialStatus,
            changedById: session!.user.id,
          },
        },
      },
      include: { technician: true, bay: true },
    });

    if (bayId) {
      await prisma.serviceBay.update({ where: { id: bayId }, data: { status: 'OCCUPIED' } });
    }

    return NextResponse.json({ jobCard }, { status: 201 });
  } catch (error) {
    console.error('Error creating job card:', error);
    return NextResponse.json({ error: 'Failed to create job card' }, { status: 500 });
  }
}
