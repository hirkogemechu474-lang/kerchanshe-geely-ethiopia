/**
 * MessageRepository — server-only Prisma queries for the Message table,
 * as touched by the admin inbox.
 */
import { prisma } from '@/lib/prisma';
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
};
