/**
 * SettingRepository — server-only Prisma queries for the generic key/value
 * Setting table (about content, business settings, contact info, cookie
 * banner config, social media links, vehicle settings, etc).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const settingRepository = {
  async findByKey(key: string) {
    return prisma.setting.findUnique({ where: { key } });
  },

  async findAll() {
    return prisma.setting.findMany({ orderBy: { key: 'asc' } });
  },

  async findManyByType(type: string) {
    return prisma.setting.findMany({ where: { type }, orderBy: { key: 'asc' } });
  },

  async findManyByKeys(keys: string[]) {
    return prisma.setting.findMany({ where: { key: { in: keys } } });
  },

  async findManyByKeyPrefixes(prefixes: string[]) {
    return prisma.setting.findMany({
      where: { OR: prefixes.map((prefix) => ({ key: { startsWith: prefix } })) },
    });
  },

  async upsert(key: string, value: string, type: string) {
    return prisma.setting.upsert({
      where: { key },
      update: { value, type, updatedAt: new Date() },
      create: { key, value, type },
    });
  },

  async update(key: string, data: Prisma.SettingUpdateInput) {
    return prisma.setting.update({ where: { key }, data });
  },

  async delete(key: string) {
    return prisma.setting.delete({ where: { key } });
  },
};
