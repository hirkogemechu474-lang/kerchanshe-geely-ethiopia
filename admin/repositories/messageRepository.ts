/**
 * MessageRepository — server-only Prisma queries for the Message table,
 * as touched by the admin inbox.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const messageRepository = {
  async update(id: string, data: Prisma.MessageUpdateInput) {
    return prisma.message.update({ where: { id }, data });
  },
};
