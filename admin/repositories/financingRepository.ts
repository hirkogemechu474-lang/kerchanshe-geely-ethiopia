/**
 * FinancingRepository — server-only Prisma queries for financing banks and
 * programs.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const financingRepository = {
  // ── Programs ─────────────────────────────────────────────────────────
  async findManyPrograms(where: Prisma.FinancingProgramWhereInput) {
    return prisma.financingProgram.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { interestRate: 'asc' }],
      include: {
        bank: { select: { id: true, name: true, slug: true, logoUrl: true, websiteUrl: true, phoneNumber: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
        vehicleCategory: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async findProgramBySlug(slug: string) {
    return prisma.financingProgram.findUnique({ where: { slug } });
  },

  async createProgram(data: Prisma.FinancingProgramCreateInput) {
    return prisma.financingProgram.create({
      data,
      include: {
        bank: { select: { id: true, name: true, slug: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async findProgramById(id: string) {
    return prisma.financingProgram.findUnique({
      where: { id },
      include: {
        bank: { select: { id: true, name: true, slug: true, logoUrl: true } },
        vehicle: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async updateProgram(id: string, data: Prisma.FinancingProgramUpdateInput) {
    return prisma.financingProgram.update({ where: { id }, data });
  },

  async deleteProgram(id: string) {
    return prisma.financingProgram.delete({ where: { id } });
  },

  // ── Banks ────────────────────────────────────────────────────────────
  async findAllBanks() {
    return prisma.financingBank.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { _count: { select: { financingPrograms: true } } },
    });
  },

  async findBankBySlug(slug: string) {
    return prisma.financingBank.findUnique({ where: { slug } });
  },

  async createBank(data: Prisma.FinancingBankCreateInput) {
    return prisma.financingBank.create({ data });
  },

  async findBankById(id: string) {
    return prisma.financingBank.findUnique({ where: { id } });
  },

  async updateBank(id: string, data: Prisma.FinancingBankUpdateInput) {
    return prisma.financingBank.update({ where: { id }, data });
  },

  async deleteBank(id: string) {
    return prisma.financingBank.delete({ where: { id } });
  },
};
