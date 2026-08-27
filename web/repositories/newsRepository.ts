/**
 * NewsRepository — server-only Prisma queries for news articles.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const newsRepository = {
  async findMany(params?: { status?: string; category?: string }) {
    const where: Prisma.NewsArticleWhereInput = {};
    if (params?.status && params.status !== 'all') where.status = params.status;
    if (params?.category && params.category !== 'all') where.category = params.category;

    return prisma.newsArticle.findMany({
      where,
      orderBy: { publishDate: 'desc' },
    });
  },

  async findPublished(limit = 6) {
    return prisma.newsArticle.findMany({
      where: { status: 'published' },
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        category: true,
        publishDate: true,
        createdAt: true,
        imageUrl: true,
        excerpt: true,
      },
    });
  },

  async create(data: Prisma.NewsArticleCreateInput) {
    return prisma.newsArticle.create({ data });
  },
};
