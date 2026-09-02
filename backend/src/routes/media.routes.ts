import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/media (list media)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const folder = req.query.folder as string;

    const where: any = {};
    if (folder) where.folder = folder;

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.mediaAsset.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media (upload media)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.media` (no such model — the real one is
    // `MediaAsset`) with an `uploadedById` field that doesn't exist on it
    // either (no uploader/actor column on this model at all).
    const media = await prisma.mediaAsset.create({ data: req.body });
    res.status(201).json(media);
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as mediaRoutes };
