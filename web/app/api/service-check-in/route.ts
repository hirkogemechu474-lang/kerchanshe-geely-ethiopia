import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { sendFormEmail } from '@/lib/form-email';

// Customer Self Check-in Kiosk (BRD Screen 3, UC-04 alt flow): "if no bay is
// immediately available, the job card is created with status Awaiting Bay
// and the customer is informed of the estimated wait" — here every kiosk
// check-in lands in DRAFT_CHECKIN with no bay/technician; an advisor
// completes the write-up at the counter. Matches today's ServiceBooking
// appointments by phone (mirroring
// admin/app/api/admin/service-bookings/[id]/convert-to-job-card/route.ts's
// field mapping exactly, since a staff member can still convert the same
// booking manually if the customer never touches the kiosk — the existing
// route's own `if (booking.jobCard)` guard already prevents a double link),
// falling back to a fresh walk-in when no appointment matches.
async function nextJobCardNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: 'jobCard' },
    create: { name: 'jobCard', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `JC-${counter.value}`;
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.serviceCheckIn);
  if (rateLimitResult) return rateLimitResult;

  const body = await request.json().catch(() => null);
  const plateNo = typeof body?.plateNo === 'string' ? body.plateNo.trim() : '';
  const vin = typeof body?.vin === 'string' ? body.vin.trim() : '';
  const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : '';
  const customerPhone = typeof body?.customerPhone === 'string' ? body.customerPhone.trim() : '';
  const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim() : '';

  if (!plateNo || !customerName || !customerPhone) {
    return NextResponse.json({ error: 'Plate number, name, and phone are required' }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // FR-201-style lookup so a returning customer doesn't have to repeat
  // known information — same matching rule as the advisor-side lookup in
  // admin/app/api/admin/workshop/vehicle-lookup.
  const matched = await prisma.customerVehicle.findFirst({
    where: vin ? { vin: { equals: vin, mode: 'insensitive' } } : { plateNo: { equals: plateNo, mode: 'insensitive' } },
    include: { customer: { select: { fullName: true, phone: true, email: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  // Kiosk ↔ appointment matching: an unconverted ServiceBooking for today
  // under the same phone number means this check-in IS that appointment,
  // not a fresh walk-in.
  const bookingMatch = await prisma.serviceBooking.findFirst({
    where: {
      customerPhone,
      date: { gte: todayStart, lte: todayEnd },
      jobCard: null,
    },
    orderBy: { date: 'asc' },
  });

  const jobCardNo = await nextJobCardNo();

  const jobCard = await prisma.jobCard.create({
    data: {
      jobCardNo,
      plateNo,
      vin: vin || matched?.vin || null,
      vehicleModel: matched?.model || null,
      customerName: matched?.customer.fullName || customerName,
      customerPhone: matched?.customer.phone || customerPhone,
      customerEmail: matched?.customer.email || customerEmail || null,
      complaintText: bookingMatch ? bookingMatch.notes || bookingMatch.serviceType : null,
      status: 'DRAFT_CHECKIN',
      customerVehicleId: matched?.id || null,
      serviceBookingId: bookingMatch?.id || null,
      warrantyStartDate: matched?.warrantyStartDate || null,
      warrantyEndDate: matched?.warrantyEndDate || null,
      statusHistory: {
        create: { fromStatus: null, toStatus: 'DRAFT_CHECKIN', changedById: 'kiosk-self-checkin', reasonCode: 'KIOSK_SELF_CHECKIN' },
      },
    },
  });

  const queuePosition = await prisma.jobCard.count({
    where: { status: 'DRAFT_CHECKIN', openTs: { gte: todayStart, lte: todayEnd } },
  });

  if (jobCard.customerEmail) {
    try {
      await sendFormEmail({
        type: 'service check-in',
        name: jobCard.customerName,
        email: jobCard.customerEmail,
        phone: jobCard.customerPhone,
        subject: `Service check-in — ${jobCard.jobCardNo}`,
        reference: jobCard.jobCardNo,
        details: [
          `Plate number: ${plateNo}`,
          `Vehicle: ${jobCard.vehicleModel || 'Not on file'}`,
          `Queue position: #${queuePosition}`,
          bookingMatch ? `Matched appointment: ${bookingMatch.serviceType}` : 'Walk-in (no appointment matched)',
        ].join('\n'),
      });
    } catch (emailError) {
      console.error('[service-check-in:email]', emailError);
    }
  }

  return NextResponse.json({
    jobCardNo: jobCard.jobCardNo,
    queuePosition,
    matchedAppointment: Boolean(bookingMatch),
    serviceType: bookingMatch?.serviceType || null,
  }, { status: 201 });
}
