/**
 * Admin vehicle repository — server-only Prisma queries with full access.
 */
import { prisma } from '@/lib/prisma';

export const vehicleRepository = {
  async findAll(params?: {
    status?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page     = params?.page     ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const skip     = (page - 1) * pageSize;

    const where = {
      ...(params?.status     && { status: params.status }),
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.search     && {
        OR: [
          { name:  { contains: params.search, mode: 'insensitive' as const } },
          { model: { contains: params.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        include: { vehicleCategory: true, brand: true },
        orderBy: { displayOrder: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.vehicle.count({ where }),
    ]);

    return { vehicles, total, page, pageSize };
  },

  async findById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { vehicleCategory: true, brand: true },
    });
  },

  async create(data: Parameters<typeof prisma.vehicle.create>[0]['data']) {
    return prisma.vehicle.create({ data, include: { vehicleCategory: true, brand: true } });
  },

  async update(id: string, data: Parameters<typeof prisma.vehicle.update>[0]['data']) {
    return prisma.vehicle.update({ where: { id }, data, include: { vehicleCategory: true, brand: true } });
  },

  async delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  },

  // ── Admin vehicles list/detail (app/api/admin/vehicles) ────────────────
  async findManyForAdmin(where: any, skip: number, take: number) {
    return Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: { _count: { select: { testDrives: true } } },
      }),
    ]);
  },

  async createVehicle(data: Parameters<typeof prisma.vehicle.create>[0]['data']) {
    return prisma.vehicle.create({ data });
  },

  async findByIdWithDetail(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        brand: true,
        vehicleCategory: true,
        testDrives: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  },

  async updateVehicle(id: string, data: Parameters<typeof prisma.vehicle.update>[0]['data']) {
    return prisma.vehicle.update({ where: { id }, data });
  },

  async findByIdWithTestDriveCount(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: { _count: { select: { testDrives: true } } },
    });
  },

  async archive(id: string) {
    return prisma.vehicle.update({ where: { id }, data: { isActive: false, status: 'archived' } });
  },

  // ── Accessories (vehicle-scoped or global when vehicleId is null) ──────
  async findAccessories(vehicleId: string) {
    return prisma.vehicleAccessory.findMany({
      where: { OR: [{ vehicleId }, { vehicleId: null }] },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  },
  async findAccessoryById(id: string) {
    return prisma.vehicleAccessory.findUnique({ where: { id } });
  },
  async createAccessory(data: Parameters<typeof prisma.vehicleAccessory.create>[0]['data']) {
    return prisma.vehicleAccessory.create({ data });
  },
  async updateAccessory(id: string, data: Parameters<typeof prisma.vehicleAccessory.update>[0]['data']) {
    return prisma.vehicleAccessory.update({ where: { id }, data });
  },
  async deleteAccessory(id: string) {
    return prisma.vehicleAccessory.delete({ where: { id } });
  },

  // ── Colors (vehicle-scoped, single isDefault enforced) ──────────────────
  async findColors(vehicleId: string) {
    return prisma.vehicleColor.findMany({ where: { vehicleId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  },
  async findColorById(id: string) {
    return prisma.vehicleColor.findUnique({ where: { id } });
  },
  async createColor(data: Parameters<typeof prisma.vehicleColor.create>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.vehicleColor.updateMany({ where: { vehicleId: data.vehicleId as string, isDefault: true }, data: { isDefault: false } });
      }
      return tx.vehicleColor.create({ data });
    });
  },
  async updateColor(id: string, data: Parameters<typeof prisma.vehicleColor.update>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.vehicleColor.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');
      if (data.isDefault) {
        await tx.vehicleColor.updateMany({ where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      }
      return tx.vehicleColor.update({ where: { id }, data });
    });
  },
  async deleteColor(id: string) {
    return prisma.vehicleColor.delete({ where: { id } });
  },

  // ── Interiors (vehicle-scoped, single isDefault enforced) ───────────────
  async findInteriors(vehicleId: string) {
    return prisma.vehicleInterior.findMany({ where: { vehicleId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  },
  async findInteriorById(id: string) {
    return prisma.vehicleInterior.findUnique({ where: { id } });
  },
  async createInterior(data: Parameters<typeof prisma.vehicleInterior.create>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.vehicleInterior.updateMany({ where: { vehicleId: data.vehicleId as string, isDefault: true }, data: { isDefault: false } });
      }
      return tx.vehicleInterior.create({ data });
    });
  },
  async updateInterior(id: string, data: Parameters<typeof prisma.vehicleInterior.update>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.vehicleInterior.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');
      if (data.isDefault) {
        await tx.vehicleInterior.updateMany({ where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      }
      return tx.vehicleInterior.update({ where: { id }, data });
    });
  },
  async deleteInterior(id: string) {
    return prisma.vehicleInterior.delete({ where: { id } });
  },

  // ── Packages / trims (vehicle-scoped, single isDefault enforced) ────────
  async findPackages(vehicleId: string) {
    return prisma.vehiclePackage.findMany({ where: { vehicleId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  },
  async findPackageById(id: string) {
    return prisma.vehiclePackage.findUnique({ where: { id } });
  },
  async createPackage(data: Parameters<typeof prisma.vehiclePackage.create>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.vehiclePackage.updateMany({ where: { vehicleId: data.vehicleId as string, isDefault: true }, data: { isDefault: false } });
      }
      return tx.vehiclePackage.create({ data });
    });
  },
  async updatePackage(id: string, data: Parameters<typeof prisma.vehiclePackage.update>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.vehiclePackage.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');
      if (data.isDefault) {
        await tx.vehiclePackage.updateMany({ where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      }
      return tx.vehiclePackage.update({ where: { id }, data });
    });
  },
  async deletePackage(id: string) {
    return prisma.vehiclePackage.delete({ where: { id } });
  },

  // ── Wheels (vehicle-scoped or global when vehicleId is null) ────────────
  async findWheels(vehicleId: string) {
    return prisma.vehicleWheel.findMany({
      where: { OR: [{ vehicleId }, { vehicleId: null }] },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  },
  async findWheelById(id: string) {
    return prisma.vehicleWheel.findUnique({ where: { id } });
  },
  async createWheel(data: Parameters<typeof prisma.vehicleWheel.create>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.vehicleWheel.updateMany({ where: { vehicleId: (data.vehicleId as string) || null, isDefault: true }, data: { isDefault: false } });
      }
      return tx.vehicleWheel.create({ data });
    });
  },
  async updateWheel(id: string, data: Parameters<typeof prisma.vehicleWheel.update>[0]['data']) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.vehicleWheel.findUnique({ where: { id } });
      if (!existing) throw new Error('NOT_FOUND');
      if (data.isDefault) {
        await tx.vehicleWheel.updateMany({ where: { vehicleId: existing.vehicleId, isDefault: true, id: { not: id } }, data: { isDefault: false } });
      }
      return tx.vehicleWheel.update({ where: { id }, data });
    });
  },
  async deleteWheel(id: string) {
    return prisma.vehicleWheel.delete({ where: { id } });
  },

  /** Best-effort name match — a quotation's vehicleModel is a plain string,
   *  not an FK, so this is used only to build an optional deep-link. */
  async findIdByName(name: string) {
    return prisma.vehicle.findFirst({ where: { name }, select: { id: true } });
  },
};
