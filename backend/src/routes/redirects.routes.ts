import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// GET /api/redirects/list (list active redirects)
router.get('/list', async (req: Request, res: Response) => {
  try {
    const redirects = await prisma.redirect.findMany({ where: { isActive: true } });
    res.json(redirects);
  } catch (error) {
    console.error('List redirects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/redirects/hit (increment hit count)
router.post('/hit', async (req: Request, res: Response) => {
  try {
    const { fromPath } = req.body;
    const redirect = await prisma.redirect.findFirst({ where: { fromPath, isActive: true } });
    if (!redirect) { res.status(404).json({ error: 'Redirect not found' }); return; }

    await prisma.redirect.update({ where: { id: redirect.id }, data: { hitCount: { increment: 1 } } });
    res.json({ toPath: redirect.toPath });
  } catch (error) {
    console.error('Redirect hit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as redirectRoutes };
