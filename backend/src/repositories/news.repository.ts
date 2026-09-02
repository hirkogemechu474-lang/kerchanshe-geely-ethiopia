import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const newsRepository = {
  async findAll() {
    return prisma.newsArticle.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async findById(id: string) {
    return prisma.newsArticle.findUnique({ where: { id } });
  },

  async create(data: Prisma.NewsArticleCreateInput) {
    return prisma.newsArticle.create({ data });
  },

  async update(id: string, data: Prisma.NewsArticleUpdateInput) {
    return prisma.newsArticle.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.newsArticle.delete({ where: { id } });
  },

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
        id: true, title: true, category: true, publishDate: true,
        createdAt: true, imageUrl: true, excerpt: true,
      },
    });
  },
};
