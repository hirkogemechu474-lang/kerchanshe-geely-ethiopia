import { serviceBookingRepository, jobCardRepository, customerRepository } from '../../repositories';
import { prisma } from '../../config/database';

export const convertToJobCardService = {
  async convert(bookingId: string, createdById: string, data?: {
    technicianId?: string;
    bayId?: string;
    complaintText?: string;
    plateNo?: string;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const booking = await serviceBookingRepository.findByIdWithJobCard(bookingId);
      if (!booking) return { ok: false, error: 'Service booking not found.' };

      if (booking.jobCard) {
        return { ok: false, error: 'This booking already has a job card.' };
      }

      const jobCardNo = await jobCardRepository.nextJobCardNo();

      const jobCard = await prisma.$transaction(async (tx) => {
        const jc = await tx.jobCard.create({
          data: {
            jobCardNo,
            // ServiceBooking has no plate/VIN field (it only captures free-text
            // vehicleInfo), but JobCard.plateNo is required — let the advisor
            // supply it when converting; fall back to empty string otherwise.
            plateNo: data?.plateNo || '',
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            customerEmail: booking.customerEmail,
            vehicleModel: booking.vehicleInfo,
            complaintText: data?.complaintText || `Service booking: ${booking.serviceType}`,
            status: 'DRAFT_CHECKIN',
            openTs: new Date(),
            serviceBookingId: bookingId,
            ...(data?.technicianId && { technicianId: data.technicianId }),
            ...(data?.bayId && { bayId: data.bayId }),
          },
        });

        await tx.serviceBooking.update({
          where: { id: bookingId },
          data: { status: 'CONVERTED' },
        });

        return jc;
      });

      return { ok: true, data: jobCard };
    } catch (error: any) {
      console.error('[CONVERT TO JOB CARD ERROR]', error.message);
      return { ok: false, error: 'Failed to convert booking to job card.' };
    }
  },
};
