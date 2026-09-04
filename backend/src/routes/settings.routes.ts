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

// GET/POST /api/settings/business-settings and /api/settings/contact-information
// and /api/settings/bank-details below — registered before the generic '/:key'
// routes for the same shadowing reason as social-media/policies above.
// NOTE: these three replace what the admin business-settings/contact-information
// pages used to fall through to (the generic '/:key' handler below, which
// expects a `{ value: "..." }` body — the admin pages POST the raw settings
// object directly, so saves were silently writing an empty string and reads
// never saw real data). Same JSON.stringify(req.body)/JSON.parse(setting.value)
// convention as social-media/policies, just keyed to match the Setting rows
// `public.routes.ts` already reads for the public-facing site (business_settings,
// contact_information — underscored keys, hyphenated URL segments, matching
// the pre-existing financing-page-content route's own naming mismatch).

// GET /api/settings/business-settings
router.get('/business-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'business_settings' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get business settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/business-settings
router.post('/business-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'business_settings' },
      update: { value },
      create: { key: 'business_settings', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update business settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/contact-information
router.get('/contact-information', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'contact_information' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get contact information error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/contact-information
router.post('/contact-information', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'contact_information' },
      update: { value },
      create: { key: 'contact_information', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update contact information error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/bank-details (company bank account shown on the Sales
// Agreement and Sales Invoice PDFs — see backend/src/services/pdf/companyInfo.ts)
router.get('/bank-details', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'bank_details' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get bank details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/bank-details
router.post('/bank-details', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'bank_details' },
      update: { value },
      create: { key: 'bank_details', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/settings/financing-page-content (get public financing page content)
router.get('/financing-page-content', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'financing_page_content' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value);
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get financing page content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/settings/financing-page-content (update public financing page content)
router.post('/financing-page-content', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'financing_page_content' },
      update: { value },
      create: { key: 'financing_page_content', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update financing page content error:', error);
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
