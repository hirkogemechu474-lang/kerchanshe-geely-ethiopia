import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/dealers (admin list with search)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = (req.query.q as string) || (req.query.search as string);
    const city = req.query.city as string;
    const type = req.query.type as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (city && city !== 'all') where.city = city;
    if (type && type !== 'all') where.type = type;

    const [items, total] = await Promise.all([
      prisma.dealer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.dealer.count({ where }),
    ]);

    res.json({ success: true, dealers: items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List dealers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dealers (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const dealer = await prisma.dealer.create({ data: req.body });
    res.status(201).json({ success: true, dealer });
  } catch (error) {
    console.error('Create dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dealers/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { id: req.params.id } });
    if (!dealer) { res.status(404).json({ error: 'Dealer not found' }); return; }
    res.json(dealer);
  } catch (error) {
    console.error('Get dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/dealers/:id (admin update)
router.put('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const dealer = await prisma.dealer.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, dealer });
  } catch (error) {
    console.error('Update dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/dealers/:id (admin delete)
router.delete('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.dealer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as dealerRoutes };
