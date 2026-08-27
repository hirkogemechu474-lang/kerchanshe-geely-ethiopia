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
};
