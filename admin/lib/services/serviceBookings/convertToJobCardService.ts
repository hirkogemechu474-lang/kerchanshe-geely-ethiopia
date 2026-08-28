import { serviceBookingRepository } from '@/repositories/serviceBookingRepository';
import { jobCardRepository } from '@/repositories/jobCardRepository';
import { nextJobCardNo } from '@/lib/services/workshop/jobCardNumber';

export type ConvertToJobCardResult =
  | { ok: true; jobCard: any }
  | { ok: false; httpStatus: 404 | 409; error: string };

// Converts an existing web-submitted ServiceBooking lead into a workshop
// JobCard, preserving the original booking record and linking the two.
export async function convertBookingToJobCard(bookingId: string, actingUserId: string): Promise<ConvertToJobCardResult> {
  const booking = await serviceBookingRepository.findByIdWithJobCard(bookingId);

  if (!booking) {
    return { ok: false, httpStatus: 404, error: 'Service booking not found' };
  }

  if (booking.jobCard) {
    return { ok: false, httpStatus: 409, error: `Already converted to job card ${booking.jobCard.jobCardNo}` };
  }

  const jobCardNo = await nextJobCardNo();

  const jobCard = await jobCardRepository.create({
    jobCardNo,
    plateNo: booking.vehicleInfo,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail,
    complaintText: booking.notes || booking.serviceType,
    status: 'DRAFT_CHECKIN',
    serviceBooking: { connect: { id: booking.id } },
    statusHistory: {
      create: { fromStatus: null, toStatus: 'DRAFT_CHECKIN', changedById: actingUserId },
    },
  });

  return { ok: true, jobCard };
}
