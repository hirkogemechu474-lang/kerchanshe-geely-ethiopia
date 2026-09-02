import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// GET /api/search (search)
router.get('/', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) { res.status(400).json({ error: 'Search query is required' }); return; }

    const [vehicles, news, parts, promotions] = await Promise.all([
      prisma.vehicle.findMany({
        where: { isActive: true, OR: [{ name: { contains: q, mode: 'insensitive' } }, { model: { contains: q, mode: 'insensitive' } }] },
        take: 5,
        select: { id: true, name: true, slug: true, model: true, featuredImage: true },
      }),
      prisma.newsArticle.findMany({
        where: { status: 'published', OR: [{ title: { contains: q, mode: 'insensitive' } }, { excerpt: { contains: q, mode: 'insensitive' } }] },
        take: 5,
        select: { id: true, title: true, slug: true, featuredImage: true },
      }),
      prisma.sparePart.findMany({
        where: { isActive: true, OR: [{ name: { contains: q, mode: 'insensitive' } }, { partNumber: { contains: q, mode: 'insensitive' } }] },
        take: 5,
        select: { id: true, name: true, partNumber: true, image: true },
      }),
      prisma.promotion.findMany({
        where: { isActive: true, OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
        take: 5,
        select: { id: true, title: true, slug: true, featuredImage: true },
      }),
    ]);

    res.json({ vehicles, news, parts, promotions });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as searchRoutes };
