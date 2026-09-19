import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';

// Every route in this file only ever required a valid admin session, never
// checked canManageSpareParts — matching apps/admin/components/admin/
// AdminLayout.tsx's sidebar, which gates every /admin/parts* link on that
// one permission (it never distinguishes a separate "view" tier for this
// area). Any authenticated admin of any role could create/edit/delete spare
// parts and parts-CMS content via a direct API call regardless of role.
const gate = requirePermission('canManageSpareParts');

const router = Router();

// GET /api/parts (admin list)
router.get('/', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const brandId = req.query.brandId as string;
    const featured = req.query.featured as string;

    const where: any = {};
    if (search) {
      // SparePart has no `partNumber` column (the real field is `sku`) —
      // filtering on it threw a PrismaClientValidationError (500) the
      // moment any caller passed ?search=, even though the current list
      // page never does today.
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    // `categoryId`/`brandId` mirror the naming used by other admin list
    // endpoints, but SparePart's real columns are `partCategoryId` (an FK)
    // and `brand` (a freeform string, no PartBrand relation exists) — using
    // the wrong names here also threw on any caller that passed them.
    if (categoryId) where.partCategoryId = categoryId;
    if (brandId) where.brand = { contains: brandId, mode: 'insensitive' };
    if (featured === 'true') where.isFeatured = true;
    if (featured === 'false') where.isFeatured = false;

    const [items, total] = await Promise.all([
      prisma.sparePart.findMany({
        where,
        include: { partCategory: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sparePart.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List parts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/parts (admin create)
router.post('/', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const part = await prisma.sparePart.create({ data: req.body });
    res.status(201).json(part);
  } catch (error) {
    console.error('Create part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/parts/:id (admin detail)
router.get('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const part = await prisma.sparePart.findUnique({ where: { id: req.params.id }, include: { partCategory: true } });
    if (!part) { res.status(404).json({ error: 'Part not found' }); return; }
    res.json(part);
  } catch (error) {
    console.error('Get part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/parts/:id (admin update)
router.put('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const part = await prisma.sparePart.update({ where: { id: req.params.id }, data: req.body });
    res.json(part);
  } catch (error) {
    console.error('Update part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/parts/:id (admin delete)
router.delete('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    await prisma.sparePart.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── CMS Content ──────────────────────────────────────────────────────────

// GET /api/parts/admin/parts/content
// NOTE: previously queried a `pCMSContent` model that doesn't exist in
// prisma/schema.prisma (threw at runtime) — there's already a real,
// dedicated `PartsPageContent` model (singleton row, same as the admin
// content aggregator page reads via `.findFirst()`); use that instead.
router.get('/admin/parts/content', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const content = await prisma.partsPageContent.findFirst();
    res.json(content || {});
  } catch (error) {
    console.error('Get parts content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/parts/admin/parts/content
router.put('/admin/parts/content', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.partsPageContent.findFirst();
    const content = existing
      ? await prisma.partsPageContent.update({ where: { id: existing.id }, data: req.body })
      : await prisma.partsPageContent.create({ data: req.body });
    res.json(content);
  } catch (error) {
    console.error('Update parts content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Brands ───────────────────────────────────────────────────────────────

// GET /api/parts/admin/parts/brands
router.get('/admin/parts/brands', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const brands = await prisma.partBrand.findMany({ orderBy: { name: 'asc' } });
    res.json(brands);
  } catch (error) {
    console.error('List brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/parts/admin/parts/brands
router.post('/admin/parts/brands', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const brand = await prisma.partBrand.create({ data: req.body });
    res.status(201).json(brand);
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/parts/admin/parts/brands/:id
router.put('/admin/parts/brands/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const brand = await prisma.partBrand.update({ where: { id: req.params.id }, data: req.body });
    res.json(brand);
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/parts/admin/parts/brands/:id
router.delete('/admin/parts/brands/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    await prisma.partBrand.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Categories ───────────────────────────────────────────────────────────

// GET /api/parts/admin/parts/categories
router.get('/admin/parts/categories', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const categories = await prisma.partCategory.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/parts/admin/parts/categories
router.post('/admin/parts/categories', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const category = await prisma.partCategory.create({ data: req.body });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/parts/admin/parts/categories/:id
router.put('/admin/parts/categories/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const category = await prisma.partCategory.update({ where: { id: req.params.id }, data: req.body });
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/parts/admin/parts/categories/:id
router.delete('/admin/parts/categories/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    await prisma.partCategory.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Benefits ─────────────────────────────────────────────────────────────

// GET /api/parts/admin/parts/benefits
router.get('/admin/parts/benefits', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const benefits = await prisma.partBenefit.findMany({ orderBy: { displayOrder: 'asc' } });
    res.json(benefits);
  } catch (error) {
    console.error('List benefits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/parts/admin/parts/benefits
router.post('/admin/parts/benefits', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const benefit = await prisma.partBenefit.create({ data: req.body });
    res.status(201).json(benefit);
  } catch (error) {
    console.error('Create benefit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/parts/admin/parts/benefits/:id
router.put('/admin/parts/benefits/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const benefit = await prisma.partBenefit.update({ where: { id: req.params.id }, data: req.body });
    res.json(benefit);
  } catch (error) {
    console.error('Update benefit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/parts/admin/parts/benefits/:id
router.delete('/admin/parts/benefits/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    await prisma.partBenefit.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete benefit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/parts/admin/parts/low-stock-count
router.get('/admin/parts/low-stock-count', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const count = await prisma.sparePart.count({ where: { stock: { lte: 10 } } });
    res.json({ count });
  } catch (error) {
    console.error('Low stock count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as partsRoutes };
