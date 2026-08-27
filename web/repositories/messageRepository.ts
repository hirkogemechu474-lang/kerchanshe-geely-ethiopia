/**
 * MessageRepository — server-only Prisma queries for the Message table, as
 * used by the legacy Message-as-ledger payment/purchase flows (Vehicle
 * Purchase / Vehicle Payment category rows carry structured data encoded as
 * text lines in `content`).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const messageRepository = {
  async findByCategoryAndSubject(category: string, subject: string) {
    return prisma.message.findFirst({ where: { category, subject } });
  },

  async findLatestByCategoryAndContentContains(category: string, contentSubstring: string) {
    return prisma.message.findFirst({
      where: { category, content: { contains: contentSubstring } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.MessageCreateInput) {
    return prisma.message.create({ data });
  },

  async update(id: string, data: Prisma.MessageUpdateInput) {
    return prisma.message.update({ where: { id }, data });
  },
};
