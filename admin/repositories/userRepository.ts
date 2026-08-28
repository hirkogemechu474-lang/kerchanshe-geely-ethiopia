/**
 * User repository for the admin panel.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

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

  // ── Admin users management (app/api/admin/users) ───────────────────────
  async findAllWithSignature() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        dealerId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        signatureUrl: true,
        signatureUpdatedAt: true,
      },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, dealerId: true, createdAt: true },
    });
  },

  async findByIdSlim(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, isActive: true, dealerId: true, lastLogin: true, createdAt: true, updatedAt: true },
    });
  },

  async findByIdFull(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, dealerId: true, createdAt: true, updatedAt: true },
    });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  async updateSignatureSetupToken(id: string, token: string, expiresAt: Date) {
    return prisma.user.update({ where: { id }, data: { signatureSetupToken: token, signatureSetupTokenExpiresAt: expiresAt } });
  },

  async findManyByRoles(roles: string[]) {
    return prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  },
};
