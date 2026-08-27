/**
 * MediaAssetRepository — server-only Prisma queries for uploaded media assets.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const mediaAssetRepository = {
  async findMany(params?: { fileType?: string | null; category?: string | null }) {
    const where: Prisma.MediaAssetWhereInput = {};
    if (params?.fileType) where.fileType = params.fileType;
    if (params?.category) where.category = params.category;

    return prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.MediaAssetCreateInput) {
    return prisma.mediaAsset.create({ data });
  },
};
