import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const dealerRepository = {
  async findMany(params: { q?: string; city?: string; region?: string; type?: string }) {
    const where: Prisma.DealerWhereInput = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { city: { contains: params.q, mode: 'insensitive' } },
        { region: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.city) where.city = params.city;
    if (params.region) where.region = params.region;
    if (params.type) where.type = params.type;

    return prisma.dealer.findMany({ where, orderBy: { name: 'asc' } });
  },

  async findById(id: string) {
    return prisma.dealer.findUnique({ where: { id } });
  },

  async create(data: Prisma.DealerCreateInput) {
    return prisma.dealer.create({ data });
  },

  async update(id: string, data: Prisma.DealerUpdateInput) {
    return prisma.dealer.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.dealer.delete({ where: { id } });
  },

  async findManyPublic(city: string | null | undefined, region: string | null | undefined) {
    const where: Prisma.DealerWhereInput = { active: true };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (region) where.region = { contains: region, mode: 'insensitive' };

    return prisma.dealer.findMany({ where, orderBy: [{ featured: 'desc' }, { name: 'asc' }] });
  },

  async findAllActive() {
    return prisma.dealer.findMany({
      where: { active: true },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
    });
  },

  async findActiveById(id: string) {
    return prisma.dealer.findFirst({ where: { id, active: true } });
  },
};
