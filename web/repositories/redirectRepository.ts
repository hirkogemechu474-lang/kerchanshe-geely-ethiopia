/**
 * RedirectRepository — server-only Prisma queries for URL redirects,
 * as consumed by middleware's in-memory cache.
 */
import { prisma } from '@/lib/prisma';

export const redirectRepository = {
  async findActive() {
    return prisma.redirect.findMany({
      where: { isActive: true },
      select: { id: true, fromPath: true, toPath: true, statusCode: true },
    });
  },

  incrementHitCount(id: string) {
    // Fire-and-forget by design (see the route's own comment) — callers
    // intentionally don't await this.
    return prisma.redirect.update({ where: { id }, data: { hitCount: { increment: 1 } } });
  },
};
