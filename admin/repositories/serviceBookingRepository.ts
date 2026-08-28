/**
 * ServiceBookingRepository — server-only Prisma queries for service bookings.
 */
import { prisma } from '@/lib/prisma';

export const serviceBookingRepository = {
  async findByIdWithJobCard(id: string) {
    return prisma.serviceBooking.findUnique({
      where: { id },
      include: { jobCard: true },
    });
  },
};
