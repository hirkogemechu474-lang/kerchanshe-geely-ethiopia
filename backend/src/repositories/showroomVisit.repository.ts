import { prisma } from '../config/database';

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

  async findPage(where: { status?: string } | undefined, skip: number, take: number) {
    return Promise.all([
      prisma.showroomVisit.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.showroomVisit.count({ where }),
      prisma.showroomVisit.groupBy({ by: ['status'], _count: true }),
    ]);
  },

  async findById(id: string) {
    return prisma.showroomVisit.findUnique({ where: { id } });
  },

  async updateRegistration(id: string, data: { fullName: string; phone: string; email: string | null; status: string; registeredAt: Date }) {
    return prisma.showroomVisit.update({ where: { id }, data });
  },

  async linkQuotation(id: string, quotationId: string) {
    return prisma.showroomVisit.update({ where: { id }, data: { quotationId } });
  },

  async linkQuotationAndOrder(id: string, quotationId: string, salesOrderId: string) {
    return prisma.showroomVisit.update({ where: { id }, data: { quotationId, salesOrderId } });
  },
};
