/**
 * UserRepository — server-only Prisma queries for users, as touched by
 * web's public self-service flows (staff signature lookups for stamping
 * countersigned documents). The full user-management surface lives in admin.
 */
import { prisma } from '@/lib/prisma';

export const userRepository = {
  async findSignatureInfoById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { name: true, signatureUrl: true } });
  },
};
