/**
 * ContentRepository — server-only Prisma queries for public CMS content:
 * brands, categories, FAQs, hero sections, showcases, site nav items.
 */
import { prisma } from '@/lib/prisma';
import type { SiteNavPlacement } from '@prisma/client';

export const contentRepository = {
  async findActiveBrands() {
    return prisma.vehicleBrand.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        displayOrder: true,
        isActive: true,
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
            id: true,
            name: true,
            slug: true,
            model: true,
            year: true,
            description: true,
            images: true,
            specifications: true,
            basePrice: true,
            finalPrice: true,
            hidePrice: true,
            discountAmount: true,
            discountType: true,
            badge: true,
            isFeatured: true,
            heroImageUrl: true,
            heroVideoUrl: true,
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
        id: true,
        title: true,
        subtitle: true,
        description: true,
        mediaType: true,
        imageUrl: true,
        videoUrl: true,
        posterUrl: true,
        buttonText: true,
        buttonLink: true,
        sortOrder: true,
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
