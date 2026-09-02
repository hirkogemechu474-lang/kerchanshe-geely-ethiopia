import { prisma } from '../config/database';

export const redirectRepository = {
  async findActive() {
    return prisma.redirect.findMany({
      where: { isActive: true },
      select: { id: true, fromPath: true, toPath: true, statusCode: true },
    });
  },

  incrementHitCount(id: string) {
    return prisma.redirect.update({ where: { id }, data: { hitCount: { increment: 1 } } });
  },
};
