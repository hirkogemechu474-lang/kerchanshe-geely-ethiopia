import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/reviews (list approved)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [items, total] = await Promise.all([
      prisma.review.findMany({ where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.review.count({ where: { status: 'approved' } }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/reviews (submit review)
router.post('/', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const review = await prisma.review.create({ data: req.body });
    res.status(201).json(review);
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/reviews/admin/reviews (admin list all)
router.get('/admin/reviews', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.review.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('Admin list reviews error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/reviews/admin/reviews/:id (admin update)
router.put('/admin/reviews/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const review = await prisma.review.update({ where: { id: req.params.id }, data: req.body });
    res.json(review);
  } catch (error) {
    console.error('Admin update review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/reviews/admin/reviews/:id (admin delete)
router.delete('/admin/reviews/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as reviewRoutes };
