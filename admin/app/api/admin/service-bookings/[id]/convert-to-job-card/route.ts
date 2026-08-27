import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';
import { nextJobCardNo } from '@/lib/services/workshop/jobCardNumber';

// Converts an existing web-submitted ServiceBooking lead into a workshop
// JobCard, preserving the original booking record and linking the two.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageJobCards) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  const booking = await prisma.serviceBooking.findUnique({
    where: { id },
    include: { jobCard: true },
  });

  if (!booking) {
    return NextResponse.json({ error: 'Service booking not found' }, { status: 404 });
  }

  if (booking.jobCard) {
    return NextResponse.json(
      { error: `Already converted to job card ${booking.jobCard.jobCardNo}` },
      { status: 409 }
    );
  }

  const jobCardNo = await nextJobCardNo();

  const jobCard = await prisma.jobCard.create({
    data: {
      jobCardNo,
      plateNo: booking.vehicleInfo,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      complaintText: booking.notes || booking.serviceType,
      status: 'DRAFT_CHECKIN',
      serviceBookingId: booking.id,
      statusHistory: {
        create: { fromStatus: null, toStatus: 'DRAFT_CHECKIN', changedById: session!.user.id },
      },
    },
  });

  return NextResponse.json({ jobCard }, { status: 201 });
}
