import { jobCardRepository } from '@/repositories/jobCardRepository';
import { customerVehicleRepository } from '@/repositories/customerVehicleRepository';
import { serviceBookingRepository } from '@/repositories/serviceBookingRepository';
import { sendFormEmail } from '@/lib/form-email';

export interface CheckInInput {
  plateNo: string;
  vin: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

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
export async function checkIn(input: CheckInInput) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // FR-201-style lookup so a returning customer doesn't have to repeat
  // known information — same matching rule as the advisor-side lookup in
  // admin/app/api/admin/workshop/vehicle-lookup.
  const matched = input.vin
    ? await customerVehicleRepository.findByVin(input.vin)
    : await customerVehicleRepository.findByPlateNo(input.plateNo);

  // Kiosk ↔ appointment matching: an unconverted ServiceBooking for today
  // under the same phone number means this check-in IS that appointment,
  // not a fresh walk-in.
  const bookingMatch = await serviceBookingRepository.findTodayUnconvertedByPhone(input.customerPhone, todayStart, todayEnd);

  const jobCardNo = await jobCardRepository.nextJobCardNo();

  const jobCard = await jobCardRepository.create({
    jobCardNo,
    plateNo: input.plateNo,
    vin: input.vin || matched?.vin || null,
    vehicleModel: matched?.model || null,
    customerName: matched?.customer.fullName || input.customerName,
    customerPhone: matched?.customer.phone || input.customerPhone,
    customerEmail: matched?.customer.email || input.customerEmail || null,
    complaintText: bookingMatch ? bookingMatch.notes || bookingMatch.serviceType : null,
    status: 'DRAFT_CHECKIN',
    customerVehicle: matched ? { connect: { id: matched.id } } : undefined,
    serviceBooking: bookingMatch ? { connect: { id: bookingMatch.id } } : undefined,
    warrantyStartDate: matched?.warrantyStartDate || null,
    warrantyEndDate: matched?.warrantyEndDate || null,
    statusHistory: {
      create: { fromStatus: null, toStatus: 'DRAFT_CHECKIN', changedById: 'kiosk-self-checkin', reasonCode: 'KIOSK_SELF_CHECKIN' },
    },
  });

  const queuePosition = await jobCardRepository.countDraftCheckinToday(todayStart, todayEnd);

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
          `Plate number: ${input.plateNo}`,
          `Vehicle: ${jobCard.vehicleModel || 'Not on file'}`,
          `Queue position: #${queuePosition}`,
          bookingMatch ? `Matched appointment: ${bookingMatch.serviceType}` : 'Walk-in (no appointment matched)',
        ].join('\n'),
      });
    } catch (emailError) {
      console.error('[service-check-in:email]', emailError);
    }
  }

  return {
    jobCardNo: jobCard.jobCardNo,
    queuePosition,
    matchedAppointment: Boolean(bookingMatch),
    serviceType: bookingMatch?.serviceType || null,
  };
}
