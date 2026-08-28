/**
 * SettingRepository — server-only Prisma queries for the generic key/value
 * Setting table (CMS content blobs, business/contact/financing settings,
 * policies, social media links, vehicle feature/spec reference lists).
 */
import { prisma } from '@/lib/prisma';

export const settingRepository = {
  async findByKey(key: string) {
    return prisma.setting.findUnique({ where: { key } });
  },

  async findManyByType(type: string) {
    return prisma.setting.findMany({ where: { type } });
  },

  async upsert(key: string, value: string, type: string) {
    return prisma.setting.upsert({
      where: { key },
      update: { value, type, updatedAt: new Date() },
      create: { key, value, type },
    });
  },
};
