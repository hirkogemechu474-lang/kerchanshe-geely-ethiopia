import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/vehicles (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
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

    const [items, total] = await Promise.all([
      prisma.vehicle.findMany({ where, include: { brand: true, vehicleCategory: true, colors: true }, orderBy: { displayOrder: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/vehicles
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { brand: true, vehicleCategory: true, colors: true, accessories: true, packages: true, interiors: true, wheels: true },
    });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/vehicles/:id (soft delete)
router.delete('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.vehicle.update({ where: { id: req.params.id }, data: { isActive: false, status: 'archived' } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/vehicles/:id/brochure
router.get('/:id/brochure', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id }, include: { brand: true, colors: true, accessories: true, packages: true, interiors: true, wheels: true } });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    // TODO: Generate brochure HTML/PDF
    res.json({ vehicle });
  } catch (error) {
    console.error('Brochure error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as vehicleRoutes };
