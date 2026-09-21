import { serviceBookingRepository, jobCardRepository, customerRepository, userRepository } from '../../repositories';
import { prisma } from '../../config/database';
import { dispatchNotification } from '../email/notifications.dispatch';

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

      try {
        // Technician (unlike a User) has no email/login of its own — see the
        // schema note in workshop.routes.ts's /job-cards/:id/assign route —
        // so this notifies workshop managers instead, naming the technician
        // for context rather than emailing them directly.
        const technician = data?.technicianId
          ? await prisma.technician.findUnique({ where: { id: data.technicianId } })
          : null;
        const notifyEmails = await userRepository.findWorkshopManagerEmails();
        if (notifyEmails.length > 0) {
          await dispatchNotification({
            type: 'job_card_status',
            to: [...new Set(notifyEmails)],
            subject: `Job Card Assigned — ${jobCard.jobCardNo}`,
            data: {
              jobCardNo: jobCard.jobCardNo,
              customerName: booking.customerName,
              vehicleInfo: booking.vehicleInfo,
              ...(technician?.name && { technicianName: technician.name }),
            },
            inApp: {
              type: 'job_card_status',
              title: 'Job Card Assigned',
              body: `Job card ${jobCard.jobCardNo} for ${booking.customerName} (${booking.vehicleInfo}) was created from a service booking${technician?.name ? ` and assigned to ${technician.name}` : ''}.`,
              link: `/admin/workshop/job-cards/${jobCard.id}`,
              relatedModel: 'jobCard',
              relatedId: jobCard.id,
              priority: 'normal',
            },
          });
        }
      } catch (notifyError: any) {
        console.error('[CONVERT TO JOB CARD NOTIFICATION ERROR]', notifyError.message);
      }

      return { ok: true, data: jobCard };
    } catch (error: any) {
      console.error('[CONVERT TO JOB CARD ERROR]', error.message);
      return { ok: false, error: 'Failed to convert booking to job card.' };
    }
  },
};
