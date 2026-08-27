/**
 * ShowroomVisitRepository — server-only Prisma queries for the QR walk-in
 * showroom visit flow.
 */
import { prisma } from '@/lib/prisma';

export const showroomVisitRepository = {
  async create(data: { ipAddress: string | null; userAgent: string | null }) {
    return prisma.showroomVisit.create({
      data: { status: 'started', ipAddress: data.ipAddress, userAgent: data.userAgent },
    });
  },

  async findSummaryById(id: string) {
    return prisma.showroomVisit.findUnique({
      where: { id },
      select: { id: true, status: true, fullName: true, phone: true, email: true },
    });
  },

  async findById(id: string) {
    return prisma.showroomVisit.findUnique({ where: { id } });
  },

  async updateSelectedAction(id: string, selectedAction: string, testDriveId?: string) {
    return prisma.showroomVisit.update({
      where: { id },
      data: {
        status: selectedAction,
        selectedAction,
        completedAt: new Date(),
        ...(testDriveId && { testDriveId }),
      },
    });
  },

  async updateRegistration(id: string, data: { fullName: string; phone: string; email: string | null; status: string; registeredAt: Date }) {
    return prisma.showroomVisit.update({ where: { id }, data });
  },
};
