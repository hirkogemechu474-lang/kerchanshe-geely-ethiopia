import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { findBayConflict } from '../../route';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { technicianId, bayId, scheduledStart, scheduledEnd } = body as {
    technicianId?: string | null;
    bayId?: string | null;
    scheduledStart?: string | null;
    scheduledEnd?: string | null;
  };

  const jobCard = await prisma.jobCard.findUnique({ where: { id } });
  if (!jobCard) {
    return NextResponse.json({ error: 'Job card not found' }, { status: 404 });
  }

  const nextBayId = bayId === undefined ? jobCard.bayId : bayId;
  const nextStart = scheduledStart === undefined ? jobCard.scheduledStart : scheduledStart ? new Date(scheduledStart) : null;
  const nextEnd = scheduledEnd === undefined ? jobCard.scheduledEnd : scheduledEnd ? new Date(scheduledEnd) : null;

  // BR-008: reject an overlapping booking on the target bay.
  if (nextBayId && nextStart && nextEnd) {
    const conflict = await findBayConflict(nextBayId, nextStart, nextEnd, id);
    if (conflict) {
      return NextResponse.json(
        { error: `Bay is already booked for ${conflict.jobCardNo} in this time window` },
        { status: 409 }
      );
    }
  }

  const previousBayId = jobCard.bayId;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.jobCard.update({
      where: { id },
      data: {
        ...(technicianId !== undefined && { technicianId }),
        ...(bayId !== undefined && { bayId }),
        ...(scheduledStart !== undefined && { scheduledStart: nextStart }),
        ...(scheduledEnd !== undefined && { scheduledEnd: nextEnd }),
        // Reassigning off "awaiting a bay" now has a home for the vehicle.
        ...(jobCard.status === 'AWAITING_BAY' && bayId && { status: 'DRAFT_CHECKIN' }),
      },
      include: { technician: true, bay: true },
    });

    // BR-010: rescheduling a job card automatically frees its previous bay slot.
    if (previousBayId && previousBayId !== nextBayId) {
      const stillOccupied = await tx.jobCard.findFirst({
        where: { bayId: previousBayId, status: { notIn: ['CANCELLED', 'INVOICED_CLOSED'] }, id: { not: id } },
      });
      if (!stillOccupied) {
        await tx.serviceBay.update({ where: { id: previousBayId }, data: { status: 'FREE' } });
      }
    }
    if (nextBayId) {
      await tx.serviceBay.update({ where: { id: nextBayId }, data: { status: 'OCCUPIED' } });
    }

    return result;
  });

  return NextResponse.json({ jobCard: updated });
}
