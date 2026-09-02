import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const serviceBayRepository = {
  async findAll() {
    return prisma.serviceBay.findMany({ orderBy: [{ bayType: 'asc' }, { name: 'asc' }] });
  },

  async findActive() {
    return prisma.serviceBay.findMany({ where: { isActive: true }, orderBy: [{ bayType: 'asc' }, { name: 'asc' }] });
  },

  async create(data: Prisma.ServiceBayCreateInput) {
    return prisma.serviceBay.create({ data });
  },

  async update(id: string, data: Prisma.ServiceBayUpdateInput) {
    return prisma.serviceBay.update({ where: { id }, data });
  },

  async deactivate(id: string) {
    return prisma.serviceBay.update({ where: { id }, data: { isActive: false, status: 'OUT_OF_SERVICE' } });
  },
};
