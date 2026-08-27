/**
 * FinancingRepository — server-only Prisma queries for financing banks and
 * programs, as touched by the public purchase flow's bank-payment gate.
 */
import { prisma } from '@/lib/prisma';

export const financingRepository = {
  async findActiveBank(id: string) {
    return prisma.financingBank.findFirst({
      where: { id, isActive: true },
      select: { id: true, name: true, websiteUrl: true },
    });
  },

  async findPublishedProgramForBankAndVehicle(bankId: string, vehicleId: string) {
    return prisma.financingProgram.findFirst({
      where: {
        bankId,
        status: 'PUBLISHED',
        OR: [{ appliesToAllVehicles: true }, { vehicleId }],
      },
      select: { id: true, directPayUrl: true },
    });
  },

  async findActiveBanksWithProgramCount() {
    return prisma.financingBank.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { financingPrograms: { where: { status: 'PUBLISHED' } } },
        },
      },
    });
  },

  async findPublishedPrograms(params: { vehicleId?: string; bankId?: string; categoryId?: string }) {
    return prisma.financingProgram.findMany({
      where: {
        status: 'PUBLISHED',
        ...(params.bankId ? { bankId: params.bankId } : {}),
        ...(params.vehicleId
          ? {
              OR: [
                { appliesToAllVehicles: true },
                { vehicleId: params.vehicleId },
                ...(params.categoryId ? [{ vehicleCategoryId: params.categoryId }] : []),
              ],
            }
          : params.categoryId
          ? { OR: [{ appliesToAllVehicles: true }, { vehicleCategoryId: params.categoryId }] }
          : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { interestRate: 'asc' }],
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            websiteUrl: true,
            phoneNumber: true,
            email: true,
            branchAddress: true,
          },
        },
        vehicle: { select: { id: true, name: true, slug: true, basePrice: true, finalPrice: true } },
        vehicleCategory: { select: { id: true, name: true, slug: true } },
      },
    });
  },
};
