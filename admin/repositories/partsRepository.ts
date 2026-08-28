/**
 * PartsRepository — server-only Prisma queries for the /parts page's small
 * CMS-ish tables (benefits, brands, categories, single-record content).
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const partsRepository = {
  // ── Benefits ─────────────────────────────────────────────────────────
  async findAllBenefits() {
    return prisma.partBenefit.findMany({ orderBy: { displayOrder: 'asc' } });
  },
  async createBenefit(data: Prisma.PartBenefitCreateInput) {
    return prisma.partBenefit.create({ data });
  },
  async updateBenefit(id: string, data: Prisma.PartBenefitUpdateInput) {
    return prisma.partBenefit.update({ where: { id }, data });
  },
  async deleteBenefit(id: string) {
    return prisma.partBenefit.delete({ where: { id } });
  },

  // ── Brands ───────────────────────────────────────────────────────────
  async findAllBrands() {
    return prisma.partBrand.findMany({ orderBy: { displayOrder: 'asc' } });
  },
  async createBrand(data: Prisma.PartBrandCreateInput) {
    return prisma.partBrand.create({ data });
  },
  async updateBrand(id: string, data: Prisma.PartBrandUpdateInput) {
    return prisma.partBrand.update({ where: { id }, data });
  },
  async deleteBrand(id: string) {
    return prisma.partBrand.delete({ where: { id } });
  },

  // ── Categories ───────────────────────────────────────────────────────
  async findAllCategories() {
    return prisma.partCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { parts: true } } },
    });
  },
  async findCategoryBySlug(slug: string) {
    return prisma.partCategory.findUnique({ where: { slug } });
  },
  async createCategory(data: Prisma.PartCategoryCreateInput) {
    return prisma.partCategory.create({ data });
  },
  async updateCategory(id: string, data: Prisma.PartCategoryUpdateInput) {
    return prisma.partCategory.update({ where: { id }, data });
  },
  async deleteCategory(id: string) {
    return prisma.partCategory.delete({ where: { id } });
  },

  // ── Page content (single record) ────────────────────────────────────
  async findContent() {
    return prisma.partsPageContent.findFirst();
  },
  async createContent(data: Prisma.PartsPageContentCreateInput) {
    return prisma.partsPageContent.create({ data });
  },
  async updateContent(id: string, data: Prisma.PartsPageContentUpdateInput) {
    return prisma.partsPageContent.update({ where: { id }, data });
  },
};
