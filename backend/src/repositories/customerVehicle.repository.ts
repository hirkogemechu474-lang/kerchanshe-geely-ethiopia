import { prisma } from '../config/database';

const customerSelect = { select: { fullName: true, phone: true, email: true } } as const;

export const customerVehicleRepository = {
  async findByVin(vin: string) {
    return prisma.customerVehicle.findFirst({
      where: { vin: { equals: vin, mode: 'insensitive' } },
      include: { customer: customerSelect },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findByPlateNo(plateNo: string) {
    return prisma.customerVehicle.findFirst({
      where: { plateNo: { equals: plateNo, mode: 'insensitive' } },
      include: { customer: customerSelect },
      orderBy: { updatedAt: 'desc' },
    });
  },
};
