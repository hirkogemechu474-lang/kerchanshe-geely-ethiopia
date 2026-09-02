import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/promotions (list)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [items, total] = await Promise.all([
      prisma.promotion.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.promotion.count({ where: { isActive: true } }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List promotions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/promotions (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const promotion = await prisma.promotion.create({ data: req.body });
    res.status(201).json(promotion);
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/promotions/:id (detail)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const promotion = await prisma.promotion.findUnique({ where: { id: req.params.id } });
    if (!promotion) { res.status(404).json({ error: 'Promotion not found' }); return; }
    res.json(promotion);
  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/promotions/:id (admin update)
router.put('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const promotion = await prisma.promotion.update({ where: { id: req.params.id }, data: req.body });
    res.json(promotion);
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/promotions/:id (admin delete)
router.delete('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.promotion.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as promotionRoutes };
