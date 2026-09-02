import { prisma } from '../config/database';
import type { Prisma, WarrantyClaimStatus } from '@prisma/client';

export const warrantyClaimRepository = {
  async findMany(status: WarrantyClaimStatus | null) {
    return prisma.warrantyClaim.findMany({
      where: status ? { status } : undefined,
      include: { jobCard: { select: { jobCardNo: true, plateNo: true, customerName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.WarrantyClaimCreateInput) {
    return prisma.warrantyClaim.create({ data });
  },

  async findById(id: string) {
    return prisma.warrantyClaim.findUnique({ where: { id } });
  },

  async findByIdWithDetail(id: string) {
    return prisma.warrantyClaim.findUnique({
      where: { id },
      include: { jobCard: true, statusHistory: { orderBy: { changedAt: 'asc' } } },
    });
  },

  async findByIdWithJobCard(id: string) {
    return prisma.warrantyClaim.findUnique({ where: { id }, include: { jobCard: true } });
  },

  async update(id: string, data: Prisma.WarrantyClaimUpdateInput) {
    return prisma.warrantyClaim.update({ where: { id }, data });
  },

  async transitionStatus(
    id: string,
    claimData: Prisma.WarrantyClaimUpdateInput,
    historyData: { fromStatus: WarrantyClaimStatus; toStatus: WarrantyClaimStatus; changedById: string; reasonCode: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.warrantyClaim.update({ where: { id }, data: claimData });
      await tx.warrantyClaimStatusHistory.create({ data: { claimId: id, ...historyData } });
      return result;
    });
  },
};
