import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const messageRepository = {
  async create(data: Prisma.MessageCreateInput) {
    return prisma.message.create({ data });
  },

  async update(id: string, data: Prisma.MessageUpdateInput) {
    return prisma.message.update({ where: { id }, data });
  },

  async findManyByCategory(category: string) {
    return prisma.message.findMany({ where: { category }, orderBy: { createdAt: 'desc' } });
  },

  async findMany(params?: { status?: string; category?: string }) {
    const where: Prisma.MessageWhereInput = {};
    if (params?.status && params.status !== 'all') where.status = params.status;
    if (params?.category && params.category !== 'all') where.category = params.category;

    return prisma.message.findMany({ where, orderBy: { createdAt: 'desc' } });
  },
};
