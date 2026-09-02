import { prisma } from '../config/database';

export const counterRepository = {
  async findByName(name: string) {
    return prisma.counter.findUnique({ where: { name } });
  },

  async upsert(name: string, initialValue: number) {
    return prisma.counter.upsert({
      where: { name },
      create: { name, value: initialValue },
      update: { value: { increment: 1 } },
    });
  },
};
