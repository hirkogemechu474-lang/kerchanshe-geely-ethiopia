/**
 * VehicleRepository — server-only Prisma queries for vehicles.
 * Use this in API routes and server components, not in client components.
 */
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const vehicleRepository = {
  /** Find all active, published vehicles ordered by displayOrder */
  async findAll(params?: { featured?: boolean; categoryId?: string; limit?: number }) {
    return prisma.vehicle.findMany({
      where: {
        isActive: true,
        status: 'published',
        ...(params?.featured !== undefined && { isFeatured: params.featured }),
        ...(params?.categoryId && { categoryId: params.categoryId }),
      },
      include: { vehicleCategory: true, brand: true },
      orderBy: { displayOrder: 'asc' },
      ...(params?.limit && { take: params.limit }),
    });
  },

  /** Find a single vehicle by slug */
  async findBySlug(slug: string) {
    return prisma.vehicle.findFirst({
      where: { slug, isActive: true },
      include: { vehicleCategory: true, brand: true },
    });
  },

  /** Find a single vehicle by id */
  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { vehicleCategory: true, brand: true },
    });
  },

  /** Count active vehicles per category */
  async countByCategory() {
    return prisma.vehicle.groupBy({
      by: ['categoryId'],
      where: { isActive: true, status: 'published' },
      _count: { id: true },
    });
  },

  /** Public vehicle listing — /api/public/vehicles */
  async findPublicList(params?: { category?: string | null; featured?: boolean }) {
    const where: any = { isActive: true, status: 'published' };

    if (params?.category && params.category !== 'all') {
      // `category` may be a real VehicleCategory.slug (the system used by /admin/categories)
      // or the legacy free-text `category` column on older vehicles — match either.
      where.OR = [{ vehicleCategory: { slug: params.category } }, { category: params.category }];
    }
    if (params?.featured) where.isFeatured = true;

    return prisma.vehicle.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        model: true,
        year: true,
        category: true,
        categoryId: true,
        vehicleCategory: { select: { id: true, name: true, slug: true } },
        badge: true,
        description: true,
        images: true,
        specifications: true,
        basePrice: true,
        finalPrice: true,
        hidePrice: true,
        discountAmount: true,
        isFeatured: true,
        heroImageUrl: true,
        heroVideoUrl: true,
        status: true,
      },
    });
  },

  /** Single published vehicle for public display — /api/public/vehicles/[slug] */
  async findPublicBySlug(slug: string) {
    return prisma.vehicle.findFirst({
      where: { slug, isActive: true, status: 'published' },
      select: {
        id: true,
        name: true,
        slug: true,
        model: true,
        year: true,
        category: true,
        badge: true,
        description: true,
        images: true,
        specifications: true,
        basePrice: true,
        finalPrice: true,
        hidePrice: true,
        discountAmount: true,
        taxRate: true,
        isFeatured: true,
        brand: { select: { id: true, name: true, slug: true } },
        vehicleCategory: { select: { id: true, name: true, slug: true } },
        heroImageUrl: true,
        heroVideoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /** Related vehicles in the same category, for the vehicle detail page */
  async findRelated(category: string, excludeSlug: string, limit = 3) {
    return prisma.vehicle.findMany({
      where: { category, slug: { not: excludeSlug }, isActive: true, status: 'published' },
      orderBy: [{ displayOrder: 'asc' }, { isFeatured: 'desc' }, { name: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        basePrice: true,
        finalPrice: true,
        hidePrice: true,
        images: true,
        heroImageUrl: true,
        badge: true,
      },
    });
  },

  /** id-only lookup used to validate a slug/id before loading configuration options */
  async findPublishedIdBySlugOrId(slugOrId: string) {
    return prisma.vehicle.findFirst({
      where: { OR: [{ id: slugOrId }, { slug: slugOrId }], isActive: true, status: 'published' },
      select: { id: true },
    });
  },

  /** Colors/interiors/packages/accessories/wheels available for a vehicle */
  async findConfiguration(vehicleId: string) {
    const [colors, interiors, packages, accessories, wheels] = await Promise.all([
      prisma.vehicleColor.findMany({ where: { vehicleId }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehicleInterior.findMany({ where: { vehicleId }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehiclePackage.findMany({ where: { vehicleId }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehicleAccessory.findMany({ where: { OR: [{ vehicleId }, { vehicleId: null }], inStock: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.vehicleWheel.findMany({ where: { OR: [{ vehicleId }, { vehicleId: null }], inStock: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    return { colors, interiors, packages, accessories, wheels };
  },

  /** Vehicle for the printable brochure — matched by slug or id */
  async findForBrochure(slugOrId: string) {
    return prisma.vehicle.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }], isActive: true, status: 'published' },
      include: { brand: true, vehicleCategory: true },
    });
  },

  /** Admin vehicle list (paginated, session-gated) */
  async findAdminList(params: { search?: string; category?: string; skip: number; limit: number }) {
    const where: any = { isActive: true };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { model: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.category && params.category !== 'all') where.category = params.category;

    return Promise.all([
      prisma.vehicle.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.vehicle.count({ where }),
    ]);
  },

  async create(data: Prisma.VehicleCreateInput) {
    return prisma.vehicle.create({ data });
  },

  /** Admin single-vehicle fetch with test-drive count */
  async findByIdWithTestDriveCount(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { _count: { select: { testDrives: true } } },
    });
  },

  async update(id: string, data: Prisma.VehicleUpdateInput) {
    return prisma.vehicle.update({ where: { id }, data });
  },

  /** Soft delete — flips isActive false rather than removing the row */
  async softDelete(id: string) {
    return prisma.vehicle.update({ where: { id }, data: { isActive: false } });
  },

  /** Best-effort name match — used to preselect a vehicle from a SalesOrder's
   *  plain-string vehicleModel field (no FK link, by design). */
  async findActivePublishedByName(name: string) {
    return prisma.vehicle.findFirst({
      where: { name, isActive: true, status: 'published' },
      select: { id: true },
    });
  },

  /** Price lookup for the public quote form */
  async findForQuote(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, name: true, finalPrice: true, basePrice: true },
    });
  },

  /** Price lookup for the direct-purchase flow — only active, published vehicles */
  async findActivePublishedForPurchase(id: string) {
    return prisma.vehicle.findFirst({
      where: { id, isActive: true, status: 'published' },
      select: { id: true, name: true, finalPrice: true, basePrice: true },
    });
  },

  /** CRM lead intake: match by id if given, else by name/slug from free text */
  async findByIdOrNameOrSlug(params: { id?: string; nameOrSlug?: string }) {
    return prisma.vehicle.findFirst({
      where: params.id
        ? { id: params.id }
        : { OR: [{ name: params.nameOrSlug || '' }, { slug: params.nameOrSlug || '' }] },
      select: { id: true, name: true },
    });
  },
};
