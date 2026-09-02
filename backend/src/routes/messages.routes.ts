import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/messages (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.message.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/messages (submit contact form)
router.post('/', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const message = await prisma.message.create({ data: req.body });
    res.status(201).json({ success: true, id: message.id });
  } catch (error) {
    console.error('Submit message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/messages/:id (admin update status)
router.patch('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const message = await prisma.message.update({ where: { id: req.params.id }, data: { status } });
    res.json(message);
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as messageRoutes };
