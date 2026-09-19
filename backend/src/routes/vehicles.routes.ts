import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { generateBrochurePdf } from '../services/pdf/brochure.pdf';
import { getCompanyInfo } from '../services/pdf/companyInfo';
import { formatCurrency } from '../utils/formatting';

const router = Router();

// Every admin-session-gated route below never checked a permission — any
// authenticated staff member of any role could read/create/edit/delete
// vehicles. Split to match apps/admin/app/admin/vehicles page.tsx
// (list/detail: requirePermission('canViewVehicles')) vs new/page.tsx and
// [id]/edit/page.tsx (requirePermission('canManageVehicles')) — both fields
// exist and vary independently across roles (e.g. Marketing has
// canViewVehicles: true but canManageVehicles: false).
const viewGate = requirePermission('canViewVehicles');
const manageGate = requirePermission('canManageVehicles');

// Fields callers are allowed to sort the admin list by. Keep this in sync
// with actual scalar columns on Vehicle — never pass req.query.sortBy
// straight through to Prisma's orderBy (arbitrary-field injection).
const SORTABLE_VEHICLE_FIELDS = new Set([
  'name', 'model', 'year', 'category', 'basePrice', 'finalPrice', 'stock',
  'status', 'displayOrder', 'createdAt', 'updatedAt',
]);

// GET /api/vehicles (admin list)
router.get('/', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const categoryId = req.query.categoryId as string;

    const where: any = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { model: { contains: search, mode: 'insensitive' } }];
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    // Default to the pre-existing displayOrder asc behavior so callers that
    // don't pass sortBy/sortOrder (e.g. the public site) see no change.
    const sortByParam = req.query.sortBy as string | undefined;
    const sortOrderParam = (req.query.sortOrder as string | undefined)?.toLowerCase();
    const orderBy: any = sortByParam && SORTABLE_VEHICLE_FIELDS.has(sortByParam)
      ? { [sortByParam]: sortOrderParam === 'desc' ? 'desc' : 'asc' }
      : { displayOrder: 'asc' as const };

    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({ where, include: { brand: true, vehicleCategory: true, colors: true }, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/vehicles
router.post('/', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      const field = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'slug or SKU';
      res.status(400).json({ error: `A vehicle with that ${field} already exists.` });
      return;
    }
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/stats (admin dashboard tiles)
// Registered before GET /:id so Express doesn't shadow it (a bare
// `/:id` route would otherwise match /stats with id="stats").
router.get('/stats', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const [total, outOfStock, totalCategories, stockLevels] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { stock: { lte: 0 } } }),
      prisma.vehicleCategory.count(),
      // reorderPoint is a per-row column, so "stock > reorderPoint" can't be
      // expressed as a plain Prisma where filter (no field-to-field compare) —
      // pull the two columns for in-stock rows and split them in JS instead,
      // same pattern as reorderAlerts.service.ts / sparePartStock.service.ts.
      prisma.vehicle.findMany({
        where: { stock: { gt: 0 } },
        select: { stock: true, reorderPoint: true },
      }),
    ]);

    const inStock = stockLevels.filter((v) => v.stock > (v.reorderPoint ?? 0)).length;
    const lowStock = stockLevels.length - inStock;

    res.json({ total, inStock, lowStock, outOfStock, totalCategories });
  } catch (error) {
    console.error('Vehicle stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/brands (active brands, for admin dropdowns)
// Also registered before GET /:id to avoid route-shadowing.
router.get('/brands', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const brands = await prisma.vehicleBrand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(brands);
  } catch (error) {
    console.error('List vehicle brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/categories/:id (single category, admin editing)
// Not filtered by isActive — admins need to be able to open/edit inactive
// categories too. Registered before GET /:id to avoid route-shadowing.
router.get('/categories/:id', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const category = await prisma.vehicleCategory.findUnique({
      where: { id: req.params.id },
    });
    if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json(category);
  } catch (error) {
    console.error('Get vehicle category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        brand: true,
        vehicleCategory: true,
        colors: true,
        accessories: true,
        packages: true,
        interiors: true,
        wheels: true,
        testDrives: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { testDrives: true },
        },
      },
    });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    if (error?.code === 'P2002') {
      const field = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'slug or SKU';
      res.status(400).json({ error: `A vehicle with that ${field} already exists.` });
      return;
    }
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/vehicles/:id (permanent delete)
router.delete('/:id', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    if (error?.code === 'P2003') {
      // TestDrive and VehicleAllocation FKs are RESTRICT (real business
      // history we never want silently wiped) — everything else on Vehicle
      // (colors/interiors/packages) is CASCADE and accessories/wheels are
      // SET NULL, so this is the only way delete can be blocked.
      res.status(409).json({
        error: 'This vehicle has test drive requests or stock allocations linked to it, so it can’t be permanently deleted. Remove/reassign those records first.',
      });
      return;
    }
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/:id/brochure
// Public pages only ever have the vehicle's slug on hand (not its DB id), so
// this has to match either — a findUnique on `id` alone 404s for every real
// caller since slug and id are different values.
router.get('/:id/brochure', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: { brand: true, colors: true, accessories: true, packages: true, interiors: true, wheels: true },
    });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }

    const specsRaw = (vehicle.specifications as Record<string, any> | null) || {};
    const specifications: Record<string, string> = {
      Year: String(vehicle.year ?? '—'),
      Category: vehicle.category || '—',
      'Base Price': vehicle.basePrice ? formatCurrency(vehicle.basePrice) : '—',
    };
    flattenSpecs(specsRaw, specifications);

    const images = Array.isArray(vehicle.images) ? (vehicle.images as string[]) : [];

    const company = await getCompanyInfo();
    const pdfBuffer = await generateBrochurePdf({
      vehicleName: vehicle.name,
      model: vehicle.model,
      specifications,
      images,
    }, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${vehicle.slug}-brochure.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Brochure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function flattenSpecs(specs: Record<string, any>, out: Record<string, string>, prefix = '', depth = 0): void {
  if (depth > 2) return;
  for (const [key, value] of Object.entries(specs)) {
    if (value == null || value === '') continue;
    const label = prefix ? `${prefix} · ${key}` : key;
    if (typeof value === 'object' && !Array.isArray(value)) {
      flattenSpecs(value, out, label, depth + 1);
    } else {
      const v = Array.isArray(value) ? value.join(', ') : String(value);
      if (v.trim()) out[label] = v;
    }
  }
}

export { router as vehicleRoutes };
