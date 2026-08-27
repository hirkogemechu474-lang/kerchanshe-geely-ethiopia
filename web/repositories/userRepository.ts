/**
 * UserRepository — server-only Prisma queries for users, as touched by
 * web's public self-service flows (staff signature lookups for stamping
 * countersigned documents). The full user-management surface lives in admin.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const userRepository = {
  async findSignatureInfoById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { name: true, signatureUrl: true } });
  },

  async findManyActive(role?: string) {
    return prisma.user.findMany({
      where: { isActive: true, ...(role && role !== 'all' && { role }) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });
  },
};
