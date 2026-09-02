import { prisma } from '../config/database';
import type { Prisma } from '@prisma/client';

export const financingRepository = {
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

  async findPublishedPrograms(params: { vehicleId?: string; bankId?: string; categoryId?: string }) {
    return prisma.financingProgram.findMany({
      where: {
        status: 'PUBLISHED',
        ...(params.bankId ? { bankId: params.bankId } : {}),
        ...(params.vehicleId
          ? {
              OR: [
                { appliesToAllVehicles: true },
                { vehicleId: params.vehicleId },
                ...(params.categoryId ? [{ vehicleCategoryId: params.categoryId }] : []),
              ],
            }
          : params.categoryId
          ? { OR: [{ appliesToAllVehicles: true }, { vehicleCategoryId: params.categoryId }] }
          : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { interestRate: 'asc' }],
      include: {
        bank: {
          select: {
            id: true, name: true, slug: true, logoUrl: true,
            websiteUrl: true, phoneNumber: true, email: true, branchAddress: true,
          },
        },
        vehicle: { select: { id: true, name: true, slug: true, basePrice: true, finalPrice: true } },
        vehicleCategory: { select: { id: true, name: true, slug: true } },
      },
    });
  },

  async findActiveBanksWithProgramCount() {
    return prisma.financingBank.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { financingPrograms: { where: { status: 'PUBLISHED' } } },
        },
      },
    });
  },
};
