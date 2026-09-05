import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { contentRepository } from '../repositories/content.repository';

// Write/single-item admin endpoints for content areas whose frontend forms
// and repository CRUD methods already existed but were never wired up to an
// Express route (post Express-migration gap). The corresponding list/GET
// endpoints already live in content.routes.ts (mounted at /api/content) and
// are left untouched here.
//
// Mounted at /admin in routes/index.ts, so paths below become:
//   /api/admin/hero, /api/admin/hero/:id
//   /api/admin/faq, /api/admin/faq/:id
//   /api/admin/site-nav, /api/admin/site-nav/:id
//   /api/admin/showcase, /api/admin/showcase/:id
//   /api/admin/content/geely-team

const router = Router();

/* ------------------------------------------------------------------ */
/* Hero Sections                                                       */
/* ------------------------------------------------------------------ */

// GET /api/admin/hero/:id (single hero section, for HeroSectionForm's edit mode)
router.get('/hero/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const heroSection = await contentRepository.findHeroSectionById(req.params.id);
    if (!heroSection) { res.status(404).json({ error: 'Hero section not found' }); return; }
    res.json({ heroSection });
  } catch (error) {
    console.error('Get hero section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/hero (create)
router.post('/hero', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    if (!req.body.title || !req.body.mediaType) {
      res.status(400).json({ error: 'title and mediaType are required' });
      return;
    }
    const heroSection = await contentRepository.createHeroSection(req.body);
    res.status(201).json({ heroSection });
  } catch (error) {
    console.error('Create hero section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/hero/:id (update — also used by HeroSectionList to toggle isActive)
router.put('/hero/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const heroSection = await contentRepository.updateHeroSection(req.params.id, req.body);
    res.json({ heroSection });
  } catch (error) {
    console.error('Update hero section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/hero/:id
router.delete('/hero/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await contentRepository.deleteHeroSection(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete hero section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* FAQs                                                                 */
/* ------------------------------------------------------------------ */

// POST /api/admin/faq (create)
router.post('/faq', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    if (!req.body.question || !req.body.answer) {
      res.status(400).json({ error: 'question and answer are required' });
      return;
    }
    const faq = await contentRepository.createFaq(req.body);
    res.status(201).json(faq);
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/faq/:id (update)
router.put('/faq/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const faq = await contentRepository.updateFaq(req.params.id, req.body);
    res.json(faq);
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/faq/:id
router.delete('/faq/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await contentRepository.deleteFaq(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Site Navigation (TOP_NAV)                                            */
/* ------------------------------------------------------------------ */

// POST /api/admin/site-nav (create)
router.post('/site-nav', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    if (!req.body.placement || !req.body.label || !req.body.href) {
      res.status(400).json({ error: 'placement, label, and href are required' });
      return;
    }
    const item = await contentRepository.createSiteNavItem(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create site nav item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/site-nav/:id (update)
router.put('/site-nav/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const item = await contentRepository.updateSiteNavItem(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    console.error('Update site nav item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/site-nav/:id
router.delete('/site-nav/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await contentRepository.deleteSiteNavItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete site nav item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Vehicle Showcase (360° viewer, "Explore Every Angle" section)        */
/* ------------------------------------------------------------------ */

// POST /api/admin/showcase (create)
router.post('/showcase', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    if (!req.body.vehicleId || !req.body.vehicleName || !req.body.title) {
      res.status(400).json({ error: 'vehicleId, vehicleName, and title are required' });
      return;
    }
    const showcase = await contentRepository.createShowcase(req.body);
    res.status(201).json(showcase);
  } catch (error) {
    console.error('Create showcase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/showcase/:id (update)
router.put('/showcase/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const showcase = await contentRepository.updateShowcase(req.params.id, req.body);
    res.json(showcase);
  } catch (error) {
    console.error('Update showcase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/showcase/:id
router.delete('/showcase/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await contentRepository.deleteShowcase(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete showcase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ------------------------------------------------------------------ */
/* Geely Team (below the News page)                                     */
/* No Prisma model exists for this — stored as a JSON blob in Setting,   */
/* same convention as the /homepage content endpoints in                */
/* content.routes.ts (upsert-on-save, parse-on-load).                   */
/* ------------------------------------------------------------------ */

const GEELY_TEAM_SETTING_KEY = 'geely_team';

// GET /api/admin/content/geely-team
router.get('/content/geely-team', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: GEELY_TEAM_SETTING_KEY } });
    const parsed = setting?.value ? JSON.parse(setting.value) : { members: [] };
    res.json({ members: parsed.members || [] });
  } catch (error) {
    console.error('Get Geely Team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/content/geely-team
router.put('/content/geely-team', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const members = Array.isArray(req.body.members) ? req.body.members : [];
    const setting = await prisma.setting.upsert({
      where: { key: GEELY_TEAM_SETTING_KEY },
      update: { value: JSON.stringify({ members }) },
      create: { key: GEELY_TEAM_SETTING_KEY, value: JSON.stringify({ members }), type: 'content' },
    });
    const saved = JSON.parse(setting.value);
    res.json({ members: saved.members || [] });
  } catch (error) {
    console.error('Save Geely Team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as adminContentRoutes };
