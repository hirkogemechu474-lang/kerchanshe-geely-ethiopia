import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { contentRepository } from '../repositories/content.repository';
import type { SiteNavPlacement } from '@prisma/client';

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

// GET /api/content/hero-sections (admin: list all hero sections, including inactive)
router.get('/hero-sections', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const heroSections = await contentRepository.findHeroSections(true);
    res.json(heroSections);
  } catch (error) {
    console.error('Get hero sections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/showcases (admin: list all vehicle showcases)
router.get('/showcases', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const showcases = await contentRepository.findAllShowcases();
    res.json(showcases);
  } catch (error) {
    console.error('Get showcases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/faqs (admin: list all FAQs)
router.get('/faqs', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const faqs = await contentRepository.findAllFaqs();
    res.json(faqs);
  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/faqs/:id (admin: single FAQ)
router.get('/faqs/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const faq = await contentRepository.findFaqById(req.params.id);
    if (!faq) { res.status(404).json({ error: 'FAQ not found' }); return; }
    res.json(faq);
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/site-nav?placement=TOP_NAV (admin: list site nav items,
// optionally filtered to one placement)
router.get('/site-nav', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const placement = (req.query.placement as SiteNavPlacement | undefined) ?? null;
    const items = await contentRepository.findSiteNavItems(placement);
    res.json(items);
  } catch (error) {
    console.error('Get site nav items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as contentRoutes };
