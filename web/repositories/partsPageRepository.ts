/**
 * PartsPageRepository — server-only Prisma queries for the public /parts
 * page (content, categories, brands, benefits, plus the featured/extra
 * spare-part listings shown there).
 */
import { prisma } from '@/lib/prisma';

export const partsPageRepository = {
  async findContent() {
    return prisma.partsPageContent.findFirst();
  },

  async findActiveCategories() {
    return prisma.partCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  },

  async findActiveBrands() {
    return prisma.partBrand.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  },

  async findActiveBenefits() {
    return prisma.partBenefit.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  },

  async findFeaturedParts() {
    return prisma.sparePart.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { partCategory: true },
    });
  },

  // Include a few non-featured parts so the catalog isn't empty.
  async findExtraParts(take: number) {
    return prisma.sparePart.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { partCategory: true },
      take,
    });
  },
};
