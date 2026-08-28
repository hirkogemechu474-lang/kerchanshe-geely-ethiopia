/**
 * NewsRepository — server-only Prisma queries for news articles.
 */
import { prisma } from '@/lib/prisma';
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
};
