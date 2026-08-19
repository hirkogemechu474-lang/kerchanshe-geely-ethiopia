/**
 * User repository for the admin panel.
 */
import { prisma } from '@/lib/prisma';

export const userRepository = {
  async findAll(params?: { role?: string; search?: string }) {
    return prisma.user.findMany({
      where: {
        ...(params?.role   && { role: params.role }),
        ...(params?.search && {
          OR: [
            { name:  { contains: params.search, mode: 'insensitive' } },
            { email: { contains: params.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true,
        isActive: true, lastLogin: true, createdAt: true,
        // Never select passwordHash
      },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true, lastLogin: true, createdAt: true },
    });
  },

  async updateStatus(id: string, isActive: boolean) {
    return prisma.user.update({ where: { id }, data: { isActive } });
  },

  async updateRole(id: string, role: string) {
    return prisma.user.update({ where: { id }, data: { role } });
  },
};
