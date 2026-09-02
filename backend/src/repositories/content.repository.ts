import { prisma } from '../config/database';
import type { Prisma, SiteNavPlacement } from '@prisma/client';

export const contentRepository = {
  async findAllBrands() {
    return prisma.vehicleBrand.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { vehicles: true, categories: true } } },
    });
  },
  async findBrandById(id: string) {
    return prisma.vehicleBrand.findUnique({
      where: { id },
      include: {
        categories: true,
        vehicles: { take: 10, orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }] },
        _count: { select: { vehicles: true, categories: true } },
      },
    });
  },
  async createBrand(data: Prisma.VehicleBrandCreateInput) {
    return prisma.vehicleBrand.create({ data });
  },
  async updateBrand(id: string, data: Prisma.VehicleBrandUpdateInput) {
    return prisma.vehicleBrand.update({ where: { id }, data });
  },
  async deleteBrand(id: string) {
    return prisma.vehicleBrand.delete({ where: { id } });
  },

  async findAllCategories() {
    return prisma.vehicleCategory.findMany({
      include: { brand: true, _count: { select: { vehicles: true } } },
      orderBy: { displayOrder: 'asc' },
    });
  },
  async findCategoryById(id: string) {
    return prisma.vehicleCategory.findUnique({
      where: { id },
      include: { brand: true, vehicles: true },
    });
  },
  async findCategoryVehicleCount(id: string) {
    return prisma.vehicleCategory.findUnique({
      where: { id },
      include: { _count: { select: { vehicles: true } } },
    });
  },
  async createCategory(data: Prisma.VehicleCategoryCreateInput) {
    return prisma.vehicleCategory.create({ data });
  },
  async updateCategory(id: string, data: Prisma.VehicleCategoryUpdateInput) {
    return prisma.vehicleCategory.update({ where: { id }, data });
  },
  async deleteCategory(id: string) {
    return prisma.vehicleCategory.delete({ where: { id } });
  },

  async findHeroSections(includeInactive: boolean) {
    return prisma.heroSection.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },
  async findHeroSectionById(id: string) {
    return prisma.heroSection.findUnique({ where: { id } });
  },
  async createHeroSection(data: Prisma.HeroSectionCreateInput) {
    return prisma.heroSection.create({ data });
  },
  async updateHeroSection(id: string, data: Prisma.HeroSectionUpdateInput) {
    return prisma.heroSection.update({ where: { id }, data });
  },
  async deleteHeroSection(id: string) {
    return prisma.heroSection.delete({ where: { id } });
  },

  async findAllFaqs() {
    return prisma.fAQ.findMany({ orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }] });
  },
  async findFaqById(id: string) {
    return prisma.fAQ.findUnique({ where: { id } });
  },
  async createFaq(data: Prisma.FAQCreateInput) {
    return prisma.fAQ.create({ data });
  },
  async updateFaq(id: string, data: Prisma.FAQUpdateInput) {
    return prisma.fAQ.update({ where: { id }, data });
  },
  async deleteFaq(id: string) {
    return prisma.fAQ.delete({ where: { id } });
  },

  async findAllShowcases() {
    return prisma.vehicleShowcase.findMany({ orderBy: { sortOrder: 'asc' } });
  },
  async findShowcaseById(id: string) {
    return prisma.vehicleShowcase.findUnique({ where: { id } });
  },
  async createShowcase(data: Prisma.VehicleShowcaseCreateInput) {
    return prisma.vehicleShowcase.create({ data });
  },
  async updateShowcase(id: string, data: Prisma.VehicleShowcaseUpdateInput) {
    return prisma.vehicleShowcase.update({ where: { id }, data });
  },
  async deleteShowcase(id: string) {
    return prisma.vehicleShowcase.delete({ where: { id } });
  },

  async findSiteNavItems(placement?: SiteNavPlacement | null) {
    return prisma.siteNavItem.findMany({
      where: placement ? { placement } : undefined,
      orderBy: [{ placement: 'asc' }, { displayOrder: 'asc' }],
    });
  },
  async createSiteNavItem(data: Prisma.SiteNavItemCreateInput) {
    return prisma.siteNavItem.create({ data });
  },
  async updateSiteNavItem(id: string, data: Prisma.SiteNavItemUpdateInput) {
    return prisma.siteNavItem.update({ where: { id }, data });
  },
  async deleteSiteNavItem(id: string) {
    return prisma.siteNavItem.delete({ where: { id } });
  },

  async findChargingStations(electricPageId?: string | null) {
    return prisma.chargingStation.findMany({
      where: electricPageId ? { electricPageId } : {},
      orderBy: { name: 'asc' },
      include: { electricPage: { select: { id: true, title: true, slug: true } } },
    });
  },
  async findChargingStationById(id: string) {
    return prisma.chargingStation.findUnique({
      where: { id },
      include: { electricPage: { select: { id: true, title: true, slug: true } } },
    });
  },
  async createChargingStation(data: Prisma.ChargingStationCreateInput) {
    return prisma.chargingStation.create({ data });
  },
  async updateChargingStation(id: string, data: Prisma.ChargingStationUpdateInput) {
    return prisma.chargingStation.update({ where: { id }, data });
  },
  async deleteChargingStation(id: string) {
    return prisma.chargingStation.delete({ where: { id } });
  },

  async findActiveBrands() {
    return prisma.vehicleBrand.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true, name: true, slug: true, description: true,
        logoUrl: true, displayOrder: true, isActive: true,
      },
    });
  },

  async findActiveCategories() {
    return prisma.vehicleCategory.findMany({
      where: { isActive: true },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { vehicles: { where: { isActive: true, status: 'published' } } },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  },

  async findActiveCategoryBySlug(slug: string) {
    return prisma.vehicleCategory.findUnique({
      where: { slug, isActive: true },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        vehicles: {
          where: { isActive: true, status: 'published' },
          select: {
            id: true, name: true, slug: true, model: true, year: true,
            description: true, images: true, specifications: true,
            basePrice: true, finalPrice: true, hidePrice: true,
            discountAmount: true, discountType: true, badge: true,
            isFeatured: true, heroImageUrl: true, heroVideoUrl: true,
          },
          orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  },

  async findActiveFaqs(params?: { category?: string | null; featuredOnly?: boolean; limit?: number }) {
    const where: any = { isActive: true };
    if (params?.category) where.category = params.category;
    if (params?.featuredOnly) where.isFeatured = true;

    return prisma.fAQ.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: params?.limit,
    });
  },

  async findActiveFaqCategories() {
    const rows = await prisma.fAQ.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return rows.map((r) => r.category).filter(Boolean);
  },

  async findActiveHeroSections() {
    return prisma.heroSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true, title: true, subtitle: true, description: true,
        mediaType: true, imageUrl: true, videoUrl: true, posterUrl: true,
        buttonText: true, buttonLink: true, sortOrder: true,
      },
    });
  },

  async findActiveShowcases() {
    return prisma.vehicleShowcase.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findActiveSiteNavItems(placement?: SiteNavPlacement | null) {
    return prisma.siteNavItem.findMany({
      where: { isActive: true, ...(placement ? { placement } : {}) },
      orderBy: { displayOrder: 'asc' },
    });
  },
};
