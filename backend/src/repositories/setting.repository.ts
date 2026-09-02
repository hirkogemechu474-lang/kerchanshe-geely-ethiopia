import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const settingRepository = {
  async findByKey(key: string) {
    return prisma.setting.findUnique({ where: { key } });
  },

  async findManyByType(type: string) {
    return prisma.setting.findMany({ where: { type }, orderBy: { key: 'asc' } });
  },

  async findManyByKeys(keys: string[]) {
    return prisma.setting.findMany({ where: { key: { in: keys } } });
  },

  async upsert(key: string, value: string, type: string) {
    return prisma.setting.upsert({
      where: { key },
      update: { value, type, updatedAt: new Date() },
      create: { key, value, type },
    });
  },
};
