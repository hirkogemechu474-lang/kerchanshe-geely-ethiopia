import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { settingRepository } from '../repositories/setting.repository';

const router = Router();

// GET /api/settings/by-type/:type (list settings of a given type, e.g. 'policy')
// Registered before '/:key' below just for readability — the two patterns
// don't actually shadow each other since '/:key' only matches a single path
// segment and this route always has two.
router.get('/by-type/:type', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const settings = await settingRepository.findManyByType(req.params.type);
    res.json(settings);
  } catch (error) {
    console.error('Get settings by type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET/POST /api/settings/social-media and /api/settings/policies below are
// registered before the generic '/:key' routes further down — unlike
// '/by-type/:type' above, these single-segment paths would otherwise be
// shadowed by '/:key' (Express matches routes in registration order, and
// '/:key' matches any single segment, 'social-media'/'policies' included).

// GET /api/settings/social-media (get social links)
router.get('/social-media', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'social_media' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/social-media (update social links)
router.post('/social-media', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'social_media' },
      update: { value },
      create: { key: 'social_media', value, type: 'social' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update social media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/policies (get policies)
router.get('/policies', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'policies' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/policies (update policies)
router.post('/policies', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'policies' },
      update: { value },
      create: { key: 'policies', value, type: 'policy' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update policies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/:key (get setting)
router.get('/:key', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: req.params.key } });
    if (!setting) { res.status(404).json({ error: 'Setting not found' }); return; }
    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/:key (upsert setting)
router.post('/:key', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { value } = req.body;
    // Setting.value is a String column — guard against a caller passing a
    // non-string value (e.g. an object), which Prisma would otherwise reject.
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    const setting = await prisma.setting.upsert({
      where: { key: req.params.key },
      update: { value: stringValue },
      create: { key: req.params.key, value: stringValue, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as settingRoutes };
