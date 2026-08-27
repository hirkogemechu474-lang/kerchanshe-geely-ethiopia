/**
 * SettingRepository — server-only Prisma queries for the generic key/value
 * Setting table (about content, business settings, contact info, cookie
 * banner config, social media links, vehicle settings, etc).
 */
import { prisma } from '@/lib/prisma';

export const settingRepository = {
  async findByKey(key: string) {
    return prisma.setting.findUnique({ where: { key } });
  },
};
