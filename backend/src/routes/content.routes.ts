import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/content/homepage (get homepage content)
// NOTE: previously queried a `pCMSContent` model that doesn't exist in
// prisma/schema.prisma (threw at runtime) — content blobs like this one are
// stored in `Setting` elsewhere in this codebase (contact-information,
// business-settings, etc.), so this follows the same convention.
router.get('/homepage', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'homepage_content' } });
    res.json({ key: 'homepage', data: setting?.value ? JSON.parse(setting.value) : {} });
  } catch (error) {
    console.error('Get homepage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content/homepage (save homepage content)
router.post('/homepage', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.upsert({
      where: { key: 'homepage_content' },
      update: { value: JSON.stringify(req.body.data) },
      create: { key: 'homepage_content', value: JSON.stringify(req.body.data), type: 'content' },
    });
    res.json({ key: 'homepage', data: JSON.parse(setting.value) });
  } catch (error) {
    console.error('Save homepage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as contentRoutes };
