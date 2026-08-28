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

  // Public registration (app/api/auth/register) — no select clause,
  // matching the pre-existing inline call this replaced: intentionally NOT
  // routed through create() above, whose select includes a `department`
  // field that doesn't exist on this schema (pre-existing drift — see
  // findManyActive) and would break this otherwise-working flow.
  async createCustomer(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },

  async updateLastLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLogin: new Date() } });
  },

  // ── Password reset (app/api/auth/forgot-password, reset-password) ──────
  async findByEmailAndOtp(email: string, otp: string) {
    return prisma.user.findFirst({ where: { email, otpCode: otp } });
  },

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
};
