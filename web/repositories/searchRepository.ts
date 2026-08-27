/**
 * SearchRepository — server-only Prisma queries for the site-wide search.
 */
import { prisma } from '@/lib/prisma';

export const searchRepository = {
  async searchVehicles(query: string, limit = 5) {
    return prisma.vehicle.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { model: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: limit,
    });
  },

  async searchNews(query: string, limit = 5) {
    return prisma.newsArticle.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
        status: 'published',
      },
      take: limit,
    });
  },

  async searchDealers(query: string, limit = 5) {
    return prisma.dealer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
        active: true,
      },
      take: limit,
    });
  },
};
