/**
 * MediaAssetRepository — server-only Prisma queries for uploaded media assets.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const mediaAssetRepository = {
  async create(data: Prisma.MediaAssetCreateInput) {
    return prisma.mediaAsset.create({ data });
  },

  async findMany(where: Prisma.MediaAssetWhereInput) {
    return prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' } });
  },
};
