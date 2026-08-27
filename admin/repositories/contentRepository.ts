/**
 * ContentRepository — server-only Prisma queries for admin-managed CMS
 * content: vehicle brands, categories, hero sections, FAQs, showcases,
 * site nav items, charging stations.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma, SiteNavPlacement } from '@prisma/client';

export const contentRepository = {
  // ── Brands ──────────────────────────────────────────────────────────
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

  // ── Categories ──────────────────────────────────────────────────────
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

  // ── Hero sections ───────────────────────────────────────────────────
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

  // ── FAQs ────────────────────────────────────────────────────────────
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

  // ── Showcases ───────────────────────────────────────────────────────
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

  // ── Site nav items ──────────────────────────────────────────────────
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

  // ── Charging stations ───────────────────────────────────────────────
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
};
