import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { contentRepository } from '../repositories/content.repository';
import { deleteUploadedFile } from './upload.routes';

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

router.use(requireAdminApiSession);

// Was session-only on every route below — any authenticated staff member
// could write to any of these content areas. Gated per-route rather than
// once for the whole file because the actual consumers split across two
// different permissions: Hero/FAQ/SiteNav/Geely-Team are all driven by
// canManageContent-gated pages (content/hero, faq, site-navigation,
// content/geely-team), while Showcase and Footer are driven by
// canManageSettings-gated pages (vehicles/settings, settings/footer) — see
// each section below.

// Hero/FAQ/Showcase/SiteNav create+update below all pass `req.body` straight
// through to the repository/Prisma call, so the draft/scheduled/published
// `status` field needs no extra handling here — but `scheduledAt` arrives as
// a `<input type="datetime-local">` string (e.g. "2026-09-10T14:30", no
// seconds/timezone) which Prisma's DateTime scalar can't parse directly, and
// an empty string (status switched back to Draft/Published in the same form
// submit) must become `null`, not "". Normalize just that one field before
// forwarding the rest of the body untouched.
function withNormalizedScheduledAt(body: any) {
  if (body && typeof body === 'object' && 'scheduledAt' in body) {
    return { ...body, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null };
  }
  return body;
}

/* ------------------------------------------------------------------ */
/* Hero Sections                                                       */
/* ------------------------------------------------------------------ */

// GET /api/admin/hero/:id (single hero section, for HeroSectionForm's edit mode)
router.get('/hero/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
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
router.post('/hero', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    if (!req.body.title || !req.body.mediaType) {
      res.status(400).json({ error: 'title and mediaType are required' });
      return;
    }
    const heroSection = await contentRepository.createHeroSection(withNormalizedScheduledAt(req.body));
    res.status(201).json({ heroSection });
  } catch (error) {
    console.error('Create hero section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/hero/:id (update — also used by HeroSectionList to toggle isActive)
router.put('/hero/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    const heroSection = await contentRepository.updateHeroSection(req.params.id, withNormalizedScheduledAt(req.body));
    res.json({ heroSection });
  } catch (error) {
    console.error('Update hero section error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/hero/:id
router.delete('/hero/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    const deleted = await contentRepository.deleteHeroSection(req.params.id);
    deleteUploadedFile(deleted?.imageUrl);
    deleteUploadedFile(deleted?.videoUrl);
    deleteUploadedFile(deleted?.posterUrl);
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
router.post('/faq', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    if (!req.body.question || !req.body.answer) {
      res.status(400).json({ error: 'question and answer are required' });
      return;
    }
    const faq = await contentRepository.createFaq(withNormalizedScheduledAt(req.body));
    res.status(201).json(faq);
  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/faq/:id (update)
router.put('/faq/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    const faq = await contentRepository.updateFaq(req.params.id, withNormalizedScheduledAt(req.body));
    res.json(faq);
  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/faq/:id
router.delete('/faq/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
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
router.post('/site-nav', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    if (!req.body.placement || !req.body.label || !req.body.href) {
      res.status(400).json({ error: 'placement, label, and href are required' });
      return;
    }
    const item = await contentRepository.createSiteNavItem(withNormalizedScheduledAt(req.body));
    res.status(201).json(item);
  } catch (error) {
    console.error('Create site nav item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/site-nav/:id (update)
router.put('/site-nav/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
  try {
    const item = await contentRepository.updateSiteNavItem(req.params.id, withNormalizedScheduledAt(req.body));
    res.json(item);
  } catch (error) {
    console.error('Update site nav item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/site-nav/:id
router.delete('/site-nav/:id', requirePermission('canManageContent'), async (req: Request, res: Response) => {
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

// POST /api/admin/showcase (create) — consumed by
// apps/admin/app/admin/vehicles/settings/page.tsx, gated canManageSettings
// (not canManageContent like the sections above).
router.post('/showcase', requirePermission('canManageSettings'), async (req: Request, res: Response) => {
  try {
    if (!req.body.vehicleId || !req.body.vehicleName || !req.body.title) {
      res.status(400).json({ error: 'vehicleId, vehicleName, and title are required' });
      return;
    }
    const showcase = await contentRepository.createShowcase(withNormalizedScheduledAt(req.body));
    res.status(201).json(showcase);
  } catch (error) {
    console.error('Create showcase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/showcase/:id (update)
router.put('/showcase/:id', requirePermission('canManageSettings'), async (req: Request, res: Response) => {
  try {
    const showcase = await contentRepository.updateShowcase(req.params.id, withNormalizedScheduledAt(req.body));
    res.json(showcase);
  } catch (error) {
    console.error('Update showcase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/showcase/:id
router.delete('/showcase/:id', requirePermission('canManageSettings'), async (req: Request, res: Response) => {
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
router.get('/content/geely-team', requirePermission('canManageContent'), async (req: Request, res: Response) => {
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
router.put('/content/geely-team', requirePermission('canManageContent'), async (req: Request, res: Response) => {
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

/* ------------------------------------------------------------------ */
/* Footer (apps/web/components/Footer.tsx)                              */
/* Same convention as Geely Team above — JSON blob in Setting, upsert-  */
/* on-save, parse-on-load. The public counterpart is GET /api/public/   */
/* footer in public.routes.ts (same setting key, same default, no auth).*/
/*                                                                       */
/* Shape mirrors what Footer.tsx actually renders, NOT a naive "4       */
/* identical columns" — the "Models" column is intentionally driven by  */
/* the live vehicle list (GET /api/public/vehicles), not by admin-typed  */
/* links, so its own `links` array is always empty here and ignored by   */
/* the public site; only its heading is editable. The "Support" column   */
/* only carries the "Contact Us" link — the phone/email/address lines    */
/* under it come from the separate `contact_information` Setting        */
/* (Settings > Contact Information) and are untouched by this endpoint.  */
/* ------------------------------------------------------------------ */

const FOOTER_SETTING_KEY = 'footer_content';

// Matches the literal arrays hardcoded in Footer.tsx before this CMS
// existed, so a fresh install (no Setting row yet) renders identically to
// what was live before.
const DEFAULT_FOOTER_CONTENT = {
  columns: [
    {
      heading: 'Company',
      links: [
        { label: 'Home', href: '/' },
        { label: 'About Geely Ethiopia', href: '/about' },
        { label: 'News & Media', href: '/news' },
        { label: 'Customer Reviews', href: '/testimonials' },
      ],
    },
    {
      // Links intentionally empty — see comment above.
      heading: 'Models',
      links: [] as { label: string; href: string }[],
    },
    {
      heading: 'After-Sales Services',
      links: [
        { label: 'Service Booking', href: '/service' },
        { label: 'Warranty', href: '/warranty' },
        { label: 'Spare Parts', href: '/parts' },
        { label: 'Roadside Assistance', href: '/roadside' },
      ],
    },
    {
      heading: 'Support',
      links: [
        { label: 'Contact Us', href: '/contact' },
      ],
    },
  ],
  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

// GET /api/admin/content/footer — consumed by
// apps/admin/app/admin/settings/footer/page.tsx, gated canManageSettings.
router.get('/content/footer', requirePermission('canManageSettings'), async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: FOOTER_SETTING_KEY } });
    res.json(setting?.value ? JSON.parse(setting.value) : DEFAULT_FOOTER_CONTENT);
  } catch (error) {
    console.error('Get footer content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/content/footer
router.put('/content/footer', requirePermission('canManageSettings'), async (req: Request, res: Response) => {
  try {
    const columns = Array.isArray(req.body.columns) ? req.body.columns : DEFAULT_FOOTER_CONTENT.columns;
    const legalLinks = Array.isArray(req.body.legalLinks) ? req.body.legalLinks : DEFAULT_FOOTER_CONTENT.legalLinks;
    const data = { columns, legalLinks };
    const setting = await prisma.setting.upsert({
      where: { key: FOOTER_SETTING_KEY },
      update: { value: JSON.stringify(data) },
      create: { key: FOOTER_SETTING_KEY, value: JSON.stringify(data), type: 'content' },
    });
    res.json(JSON.parse(setting.value));
  } catch (error) {
    console.error('Save footer content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as adminContentRoutes };
