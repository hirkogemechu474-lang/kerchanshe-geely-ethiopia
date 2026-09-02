import { prisma } from '../config/database';

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

  async findExtraParts(take: number) {
    return prisma.sparePart.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: { partCategory: true },
      take,
    });
  },
};
