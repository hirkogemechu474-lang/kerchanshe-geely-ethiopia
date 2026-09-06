import { Router, Request, Response } from 'express';
import type { SiteNavPlacement } from '@prisma/client';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';
import { salesOrderRepository, vehicleRepository } from '../repositories';
import { quotationPdfService } from '../services/sales/quotationPdf.service';
import { quotationService } from '../services/sales/quotation.service';
import { convertQuotationToOrderService } from '../services/sales/convertQuotationToOrder.service';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { userRepository } from '../repositories';
import { env } from '../config/env';

let cachedManagerEmails: string[] | null = null;
let managerEmailsCachedAt = 0;
const MANAGER_EMAIL_CACHE_TTL = 5 * 60 * 1000;

// Combined draft/scheduled/published visibility gate (see `ContentStatus` in
// prisma/schema.prisma) for HeroSection, FAQ, VehicleShowcase, SiteNavItem,
// and ServicePage. This is ADDITIONAL to each model's own isActive/
// isPublished kill-switch below, not a replacement — spread both into the
// same `where`. PUBLISHED rows are always visible; SCHEDULED rows become
// visible once `scheduledAt` has passed.
function publishedOrDue() {
  return {
    OR: [
      { status: 'PUBLISHED' as const },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: new Date() } },
    ],
  };
}

// Same gate for NewsArticle, which predates ContentStatus and keeps its own
// `status: String` ('draft'/'scheduled'/'published') + `publishDate` fields
// instead (see the note on that model in schema.prisma) — reusing them here
// rather than adding a second, colliding `status` field.
function newsPublishedOrDue() {
  return {
    OR: [
      { status: 'published' as const },
      { status: 'scheduled' as const, publishDate: { lte: new Date() } },
    ],
  };
}

async function getManagerEmails(): Promise<string[]> {
  const now = Date.now();
  if (cachedManagerEmails && now - managerEmailsCachedAt < MANAGER_EMAIL_CACHE_TTL) {
    return cachedManagerEmails;
  }
  cachedManagerEmails = await userRepository.findManagerEmails();
  managerEmailsCachedAt = now;
  return cachedManagerEmails;
}
import { seedPdiChecklist } from '../services/sales/pdiChecklist.template';
import { chatbotService } from '../services/chatbot/chatbot.service';

const router = Router();

router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { isActive: true }, include: { brand: true, vehicleCategory: true, colors: true }, orderBy: { displayOrder: 'asc' } });
    res.json(vehicles);
  } catch (error) {
    console.error('List public vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:slug', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: req.params.slug, isActive: true }, include: { brand: true, vehicleCategory: true, colors: true, packages: true, interiors: true } });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    // Wheels and accessories can be scoped to this one vehicle OR marked
    // "available for all vehicles" (vehicleId: null in the admin UI) — a
    // plain relation `include` only ever returns rows whose vehicleId
    // equals this vehicle's id, so globally-scoped rows would never show up
    // for ANY vehicle (this was a real bug: the customer-facing configurator
    // silently dropped every global wheel/accessory). Fetch them separately
    // with the same OR-null scoping the admin CRUD (vehicleRepository)
    // already uses.
    const [accessories, wheels] = await Promise.all([
      vehicleRepository.findAccessories(vehicle.id),
      vehicleRepository.findWheels(vehicle.id),
    ]);
    res.json({ ...vehicle, accessories, wheels });
  } catch (error) {
    console.error('Get public vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:slug/configuration', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: req.params.slug, isActive: true }, include: { colors: true, packages: true, interiors: true } });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    // See the matching comment on GET /vehicles/:slug above — wheels/
    // accessories need the OR-null (global-scope) query, not a plain
    // relation include.
    const [accessories, wheels] = await Promise.all([
      vehicleRepository.findAccessories(vehicle.id),
      vehicleRepository.findWheels(vehicle.id),
    ]);
    res.json({ colors: vehicle.colors, accessories, packages: vehicle.packages, interiors: vehicle.interiors, wheels });
  } catch (error) {
    console.error('Get vehicle configuration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dealers', async (req: Request, res: Response) => {
  try {
    const dealers = await prisma.dealer.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    res.json(dealers);
  } catch (error) {
    console.error('List public dealers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/dealers/:id', async (req: Request, res: Response) => {
  try {
    const dealer = await prisma.dealer.findUnique({ where: { id: req.params.id } });
    if (!dealer) { res.status(404).json({ error: 'Dealer not found' }); return; }
    res.json(dealer);
  } catch (error) {
    console.error('Get public dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/brands', async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.brand`, a model that doesn't exist in schema.prisma —
    // the real vehicle-brand model (used elsewhere in this file via
    // `include: { brand: true }` on Vehicle) is `VehicleBrand`.
    const brands = await prisma.vehicleBrand.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
    res.json(brands);
  } catch (error) {
    console.error('List brands error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.vehicleCategory.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } });
    res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/categories/:slug', async (req: Request, res: Response) => {
  try {
    const category = await prisma.vehicleCategory.findFirst({ where: { slug: req.params.slug, isActive: true }, include: { vehicles: { where: { isActive: true } } } });
    if (!category) { res.status(404).json({ error: 'Category not found' }); return; }
    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NOTE: these five routes used to query a `PCMSContent` model that does not
// exist anywhere in prisma/schema.prisma (confirmed: no such model, and
// every one of them threw "Cannot read properties of undefined (reading
// 'findUnique')" at runtime) — rewritten to use the real normalized models
// the rest of the app (admin content-management pages, the old homepage
// Prisma queries) actually reads/writes.
router.get('/hero', async (req: Request, res: Response) => {
  try {
    const heroSections = await prisma.heroSection.findMany({
      where: { isActive: true, ...publishedOrDue() },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(heroSections);
  } catch (error) {
    console.error('Get hero error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/content', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'homepage_content' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get homepage content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/about', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'about_page' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get about error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/faq', async (req: Request, res: Response) => {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true, ...publishedOrDue() },
      orderBy: { displayOrder: 'asc' },
    });
    res.json(faqs);
  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/showcase', async (req: Request, res: Response) => {
  try {
    const showcases = await prisma.vehicleShowcase.findMany({
      where: { isActive: true, ...publishedOrDue() },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(showcases);
  } catch (error) {
    console.error('Get showcase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cookie-banner', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'cookie_banner' } });
    res.json(setting?.value ? JSON.parse(setting.value) : { enabled: true, message: '' });
  } catch (error) {
    console.error('Get cookie banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/social-media', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'social_media' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public read for the footer's 4 link columns + legal links row, edited at
// Settings > Footer Content (admin: GET/PUT /api/admin/content/footer, same
// `footer_content` Setting key). Default below matches the literal arrays
// that used to be hardcoded in apps/web/components/Footer.tsx so a fresh
// install renders identically until an admin edits it. The "Models" column's
// `links` are intentionally empty — Footer.tsx renders that column from the
// live GET /api/public/vehicles list instead, using only this column's
// heading; likewise the "Support" column only carries "Contact Us" here —
// phone/email/address come from the separate contact-information endpoint.
router.get('/footer', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'footer_content' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {
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
        { heading: 'Models', links: [] },
        {
          heading: 'After-Sales Services',
          links: [
            { label: 'Service Booking', href: '/service' },
            { label: 'Warranty', href: '/warranty' },
            { label: 'Spare Parts', href: '/parts' },
            { label: 'Roadside Assistance', href: '/roadside' },
          ],
        },
        { heading: 'Support', links: [{ label: 'Contact Us', href: '/contact' }] },
      ],
      legalLinks: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    });
  } catch (error) {
    console.error('Get footer content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/site-nav?placement=TOP_NAV — read by apps/web Header.tsx
// for the header's main nav / mobile drawer (expects `{ items: [...] }`).
// NOTE: this used to read a `Setting['site_navigation']` JSON blob that
// nothing in the codebase ever writes to (grep confirms zero writers) — it
// always resolved to `[]`/null, so Header.tsx silently fell back to its own
// hardcoded DEFAULT_NAV_ITEMS on every load and admin edits to SiteNavItem
// (via SiteNavManager) never actually reached the public site. Fixed to
// query the real SiteNavItem model instead — found while wiring the
// draft/scheduled/published gate below, since there was no real query here
// to add it to.
router.get('/site-nav', async (req: Request, res: Response) => {
  try {
    const placement = req.query.placement as SiteNavPlacement | undefined;
    const items = await prisma.siteNavItem.findMany({
      where: {
        isActive: true,
        ...publishedOrDue(),
        ...(placement ? { placement } : {}),
      },
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ items });
  } catch (error) {
    console.error('Get site nav error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generic plain-text/JSON setting lookup by key — used for policy pages
// (terms_of_service, privacy_policy, cookie_policy) whose content is stored
// as raw text rather than a structured blob, so it's wrapped in an object
// instead of being sent bare (res.json() on a bare string double-encodes).
router.get('/settings/:key', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: req.params.key } });
    res.json({ value: setting?.value ?? null });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/contact-information', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'contact_information' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/business-settings', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'business_settings' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get business settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicle-settings', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'vehicle_settings' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get vehicle settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/seo-settings — default meta title/description, OG image,
// Twitter handle, keywords, GA4 ID, Search Console verification code,
// Facebook/Meta Pixel ID, and optional extra robots.txt text. Read by
// apps/web for site-wide page metadata (app/layout.tsx's generateMetadata),
// conditional GA4/Pixel script injection, and app/robots.ts. Same
// Setting['seo_settings'] key the admin-only GET/POST pair in
// settings.routes.ts reads/writes.
router.get('/seo-settings', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'seo_settings' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get SEO settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/warranty-page', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'warranty_page' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get warranty page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/ev-savings-calculator', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'ev_calculator' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get EV calculator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/financing-settings', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'financing_settings' } });
    res.json(setting?.value || {});
  } catch (error) {
    console.error('Get financing settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/financing-page-content', async (req: Request, res: Response) => {
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

// GET /api/public/status?ref=GY-<CAT>-DDMMYYYY-NNN — was a complete stub
// (`res.json({ type, reference, status: 'unknown' })`, never queried
// anything, and read req.query.type/reference instead of the `ref` param
// apps/web/app/status/page.tsx actually sends) — every lookup silently
// "succeeded" with no `found` flag, which the frontend treats as "no
// request found for that reference number" regardless of whether a real
// record exists. The reference's category segment (e.g. "SQ" in
// GY-SQ-...) tells us which model to query — see utils/reference.ts's
// REFERENCE_CATEGORY. Only categories with an actual `reference` column
// are supported (Quotation/TestDrive/ServiceBooking/PartRequest/Lead/
// Message) — Purchase (SalesOrder), Financing (FinancingApplication) and
// Trade-In (TradeInEvaluation) have no reference column to look up by, so
// those categories report not-found rather than guessing.
router.get('/status', async (req: Request, res: Response) => {
  try {
    const ref = (req.query.ref as string || '').trim();
    if (!ref) { res.json({ found: false, error: 'A reference number is required.' }); return; }

    const category = ref.split('-')[1] || '';

    if (category === 'SQ') {
      const quotation = await prisma.quotation.findFirst({
        where: { reference: ref },
        include: { salesOrder: { select: { orderNo: true } } },
      });
      if (!quotation) { res.json({ found: false, error: 'No quotation found for that reference number.' }); return; }
      res.json({
        found: true,
        result: {
          type: 'quotation',
          label: 'Vehicle Quotation Request',
          reference: quotation.reference,
          status: quotation.status,
          createdAt: quotation.createdAt,
          quotationNo: quotation.quotationNo,
          orderNo: quotation.salesOrder?.orderNo ?? null,
        },
      });
      return;
    }

    if (category === 'TD') {
      const testDrive = await prisma.testDrive.findFirst({ where: { reference: ref } });
      if (!testDrive) { res.json({ found: false, error: 'No test drive found for that reference number.' }); return; }
      res.json({
        found: true,
        result: { type: 'test-drive', label: 'Test Drive Booking', reference: testDrive.reference, status: testDrive.status, createdAt: testDrive.createdAt },
      });
      return;
    }

    if (category === 'SB') {
      const booking = await prisma.serviceBooking.findFirst({ where: { reference: ref } });
      if (!booking) { res.json({ found: false, error: 'No service appointment found for that reference number.' }); return; }
      res.json({
        found: true,
        result: { type: 'service-booking', label: 'Service Appointment', reference: booking.reference, status: booking.status, createdAt: booking.createdAt },
      });
      return;
    }

    if (category === 'PR') {
      const partRequest = await prisma.partRequest.findFirst({ where: { reference: ref } });
      if (!partRequest) { res.json({ found: false, error: 'No parts request found for that reference number.' }); return; }
      res.json({
        found: true,
        result: { type: 'parts-request', label: 'Parts Request', reference: partRequest.reference, status: partRequest.status, createdAt: partRequest.createdAt },
      });
      return;
    }

    if (category === 'LD') {
      const lead = await prisma.lead.findFirst({ where: { reference: ref } });
      if (!lead) { res.json({ found: false, error: 'No request found for that reference number.' }); return; }
      res.json({
        found: true,
        result: { type: 'lead', label: 'Sales Inquiry', reference: lead.reference, status: lead.status, createdAt: lead.createdAt },
      });
      return;
    }

    if (category === 'CT') {
      const message = await prisma.message.findFirst({ where: { reference: ref } });
      if (!message) { res.json({ found: false, error: 'No request found for that reference number.' }); return; }
      res.json({
        found: true,
        result: { type: 'message', label: 'Contact / Support Request', reference: message.reference, status: message.status, createdAt: message.createdAt },
      });
      return;
    }

    res.json({ found: false, error: 'No request found for that reference number.' });
  } catch (error) {
    console.error('Status lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/news', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const [items, total] = await Promise.all([
      prisma.newsArticle.findMany({ where: newsPublishedOrDue(), orderBy: { publishDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, title: true, author: true, excerpt: true, imageUrl: true, publishDate: true, createdAt: true, category: true } }),
      prisma.newsArticle.count({ where: newsPublishedOrDue() }),
    ]);
    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List news error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/news/:id', async (req: Request, res: Response) => {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id: req.params.id } });
    const isVisible = !!article && (
      article.status === 'published' ||
      (article.status === 'scheduled' && !!article.publishDate && article.publishDate <= new Date())
    );
    if (!article || !isVisible) { res.status(404).json({ error: 'Article not found' }); return; }
    await prisma.newsArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
    const related = await prisma.newsArticle.findMany({
      where: { id: { not: article.id }, category: article.category, ...newsPublishedOrDue() },
      take: 3,
      orderBy: { publishDate: 'desc' },
    });
    res.json({ ...article, views: article.views + 1, related });
  } catch (error) {
    console.error('Get news article error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/promotions', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json(promotions);
  } catch (error) {
    console.error('List public promotions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/testimonials', async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({ where: { status: 'approved' }, orderBy: { createdAt: 'desc' }, take: 20 });
    res.json(reviews);
  } catch (error) {
    console.error('List testimonials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/parts', async (req: Request, res: Response) => {
  try {
    const content = await prisma.partsPageContent.findFirst();
    const brands = await prisma.partBrand.findMany({ where: { isActive: true } });
    const categories = await prisma.partCategory.findMany({ where: { isActive: true } });
    res.json({ content: content || {}, brands, categories });
  } catch (error) {
    console.error('Get parts page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/parts/requests', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.partsRequest` (typo) — the real model is `PartRequest`.
    const request = await prisma.partRequest.create({ data: req.body });
    res.status(201).json({ success: true, id: request.id });
  } catch (error) {
    console.error('Submit parts request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/trade-in', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.tradeIn` — no such model exists in schema.prisma.
    // Trade-in is one of the interest flags on the `Quotation` lead model
    // (tradeInInterest: Boolean), same as every other lead-capture flow in
    // this file (see leadService/quotation.service.ts) — not a separate table.
    const tradeIn = await prisma.quotation.create({ data: { ...req.body, tradeInInterest: true } });
    res.status(201).json({ success: true, id: tradeIn.id });
  } catch (error) {
    console.error('Submit trade-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quick-request', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.quickRequest` — no such model exists in schema.prisma.
    // A "quick request" is a minimal-info lead (UC-01 alt flow: "If no
    // vehicle model is selected, the lead is still saved as a general
    // enquiry"), so it's the same `Quotation` model as every other lead,
    // tagged via the real `source` field so it's distinguishable in the pipeline.
    const request = await prisma.quotation.create({ data: { ...req.body, source: req.body?.source || 'quick-request' } });
    res.status(201).json({ success: true, id: request.id });
  } catch (error) {
    console.error('Submit quick request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quotations', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // The web quote page POSTs `configuration` and `visitId`, but neither is a
    // column on Quotation (the configurator selection is stored as
    // `configurationJson`, and `visitId` is not persisted on this model).
    // Map `configuration` -> `configurationJson` and drop the non-column keys
    // so a defined `configuration` can't crash prisma.create.
    const { configuration, visitId, ...rest } = (req.body ?? {}) as Record<string, any>;
    const data: any = { ...rest };
    if (configuration !== undefined) data.configurationJson = configuration;

    const result = await quotationService.create({
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      nationalId: data.nationalId,
      idDocumentType: data.idDocumentType,
      idPhotoUrl: data.idPhotoUrl,
      customerAddress: data.customerAddress,
      vehicleModel: data.vehicleModel,
      message: data.message,
      financingInterest: data.financingInterest,
      tradeInInterest: data.tradeInInterest,
      source: data.source,
      configurationJson: data.configurationJson,
      autoAssign: true,
    });
    if (!result.ok || !result.data) {
      res.status(400).json({ error: result.error || 'Failed to save quotation' });
      return;
    }

    res.status(201).json({
      success: true,
      reference: result.data.reference,
      salesAgentNotified: Boolean(result.assignedRep),
    });
  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/quotations/:reference', async (req: Request, res: Response) => {
  try {
    // NOTE: `include: { vehicle: true, salesAgent: true }` referenced
    // relations that don't exist on Quotation — it stores `vehicleModel`
    // and `assignedTo` as plain strings, not FK relations. Dropped.
    const quotation = await prisma.quotation.findFirst({ where: { reference: req.params.reference } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    if (!['sent', 'accepted'].includes(quotation.status) || quotation.managerApprovalStatus !== 'APPROVED') {
      res.status(409).json({ error: 'This quotation is not ready for customer review yet.' });
      return;
    }
    res.json(quotation);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quotations/:reference/sign', rateLimiters.quotationSign, async (req: Request, res: Response) => {
  try {
    const signatureData = req.body?.signatureDataUrl || req.body?.photoUrl;
    const quotation = await prisma.quotation.findFirst({ where: { reference: req.params.reference } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    if (!['sent', 'accepted'].includes(quotation.status) || quotation.managerApprovalStatus !== 'APPROVED') {
      res.status(409).json({ error: 'This quotation must be approved and sent before it can be signed.' });
      return;
    }
    if (!signatureData || typeof signatureData !== 'string') {
      res.status(400).json({ error: 'A signature is required.' });
      return;
    }
    const updated = await prisma.quotation.update({ where: { id: quotation.id }, data: { status: 'accepted', signedAt: new Date(), signedDocumentUrl: signatureData } });
    const conversion = await convertQuotationToOrderService.convert(quotation.id);
    if (!conversion.ok || !conversion.data) {
      res.status(400).json({ error: conversion.error || 'Quotation signed, but the order could not be created.' });
      return;
    }

    const order = conversion.data;
    const assignedAgent = quotation.assignedTo ? await userRepository.findById(quotation.assignedTo) : null;
    const managerEmails = await getManagerEmails();
    const recipients = [assignedAgent?.email, ...managerEmails].filter((email): email is string => Boolean(email));
    if (recipients.length > 0) {
      await dispatchNotification({
        type: 'order_status',
        to: recipients,
        subject: `Quotation Signed — Order ${order.orderNo}`,
        data: {
          orderNo: order.orderNo,
          quotationNo: quotation.quotationNo || quotation.reference,
          customerName: order.customerName,
          vehicleModel: order.vehicleModel,
          nextStep: 'Sales agent review and approval is required before sending the sales agreement.',
          adminLink: `${env.urls.admin}/admin/orders/${order.id}`,
        },
        inApp: {
          type: 'order_update',
          title: 'Customer Signed — Order Created',
          body: `Hello, customer ${order.customerName} has signed the quotation. Order ${order.orderNo} has been created for ${order.vehicleModel}. Sales agent review and approval is required before sending the sales agreement.`,
          link: `/admin/orders/${order.id}`,
          orderId: order.id,
          relatedModel: 'order',
          relatedId: order.id,
          priority: 'high',
        },
      });
    }

    res.json({ ...updated, order });
  } catch (error) {
    console.error('Sign quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/quotations/:reference/pdf', async (req: Request, res: Response) => {
  try {
    // Generate the quotation PDF on demand. This is a link target opened in
    // a new tab (see apps/web/app/status/page.tsx) — it must always respond
    // with either a real PDF or a redirect to a real document, never a bare
    // JSON body (the browser would just render the JSON text where a PDF
    // was expected).
    const result = await quotationPdfService.generatePdfByReference(req.params.reference);
    if (result.ok && result.data) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="quotation.pdf"');
      res.send(result.data);
      return;
    }

    const quotation = await prisma.quotation.findFirst({ where: { reference: req.params.reference } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    if (quotation.status !== 'sent' || quotation.managerApprovalStatus !== 'APPROVED') {
      res.status(409).json({ error: 'This quotation is not ready for customer review yet.' });
      return;
    }
    // No priced quotation PDF yet — if the customer already signed
    // (signedDocumentUrl is a photo/drawn-signature image, not a PDF),
    // redirect there as the next-best document; otherwise there is
    // genuinely nothing to show yet.
    if (quotation.signedDocumentUrl) { res.redirect(quotation.signedDocumentUrl); return; }
    res.status(404).json({ error: 'This quotation has not been priced yet — a PDF is not available until a sales consultant generates it.' });
  } catch (error) {
    console.error('Get quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/quotations/by-id/:id', async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    res.json(quotation);
  } catch (error) {
    console.error('Get quotation by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/financing-applications', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.financingApplication` — no such model exists in
    // schema.prisma. The Message model's own doc comment says it backs
    // exactly this flow ("Message rows that back a customer-facing flow
    // (financing applications, contact-derived leads)"), so submissions
    // are recorded there.
    const { customerName, customerEmail, customerPhone, vehicleModel, ...rest } = req.body || {};
    const application = await prisma.message.create({
      data: {
        from: customerName || 'Unknown',
        email: customerEmail || '',
        subject: vehicleModel ? `Financing Application - ${vehicleModel}` : 'Financing Application',
        category: 'financing',
        content: JSON.stringify({ customerPhone, vehicleModel, ...rest }),
      },
    });
    res.status(201).json({ success: true, id: application.id });
  } catch (error) {
    console.error('Submit financing application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/test-drive', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const {
      firstName, lastName, email, phone, nationalId,
      vehicleId, preferredDate, preferredTime, location,
      message, consentGiven,
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !vehicleId || !preferredDate || !preferredTime || !location) {
      res.status(400).json({ error: 'All required fields must be provided.' });
      return;
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      res.status(400).json({ error: 'Selected vehicle not found.' });
      return;
    }

    const reference = `TD-${Date.now().toString(36).toUpperCase()}`;

    const testDrive = await prisma.testDrive.create({
      data: {
        customerName: `${firstName} ${lastName}`.trim(),
        customerEmail: email,
        customerPhone: phone,
        nationalId: nationalId || null,
        vehicleId,
        preferredDate: new Date(preferredDate),
        preferredTime,
        location,
        specialRequests: message || null,
        status: 'pending',
        reference,
      },
    });

    res.status(201).json({ success: true, testDriveId: testDrive.id, reference });
  } catch (error) {
    console.error('Public test drive submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/test-drives/:id', async (req: Request, res: Response) => {
  try {
    const testDrive = await prisma.testDrive.findUnique({ where: { id: req.params.id }, include: { vehicle: true } });
    if (!testDrive) { res.status(404).json({ error: 'Test drive not found' }); return; }
    res.json(testDrive);
  } catch (error) {
    console.error('Get test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/test-drives/:id/confirm', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const testDrive = await prisma.testDrive.update({ where: { id: req.params.id }, data: { status: 'confirmed', ...req.body } });
    res.json(testDrive);
  } catch (error) {
    console.error('Confirm test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/service-bookings', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.serviceBooking.create({ data: req.body });
    res.status(201).json({ success: true, id: booking.id });
  } catch (error) {
    console.error('Submit service booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/services/menu', async (req: Request, res: Response) => {
  try {
    const sections = await prisma.serviceSection.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: { items: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } } },
    });
    res.json(sections);
  } catch (error) {
    console.error('Get services menu error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/services/pages/:slug', async (req: Request, res: Response) => {
  try {
    const page = await prisma.servicePage.findFirst({ where: { slug: req.params.slug, isPublished: true, ...publishedOrDue() } });
    if (!page) { res.status(404).json({ error: 'Service page not found' }); return; }
    res.json(page);
  } catch (error) {
    console.error('Get service page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/financing-programs', async (req: Request, res: Response) => {
  try {
    // NOTE: FinancingProgram has no `isActive` — "active" is expressed via
    // the `status` enum (DRAFT/PUBLISHED/ARCHIVED); a publicly-listable
    // program is one with status PUBLISHED.
    const { vehicleId } = req.query;
    const where: any = { status: 'PUBLISHED' };
    if (vehicleId) {
      where.OR = [
        { vehicleId: vehicleId as string },
        { vehicleCategoryId: vehicleId as string }, // Also check if it's a category ID
        { appliesToAllVehicles: true },
      ];
    }
    const programs = await prisma.financingProgram.findMany({
      where,
      include: { bank: true },
    });
    res.json(programs);
  } catch (error) {
    console.error('List financing programs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/financing-banks', async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.bank` — the real model is `FinancingBank`.
    const banks = await prisma.financingBank.findMany({
      where: { isActive: true },
      include: { _count: { select: { financingPrograms: true } } }
    });
    res.json(banks);
  } catch (error) {
    console.error('List financing banks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NOTE: the four routes below used a `Purchase`/`Payment` model that doesn't
// exist anywhere in schema.prisma. There's no separate payment ledger table —
// a "purchase" is a `SalesOrder`, and payment state lives directly on it
// (paymentStatus/paymentProofUrl/paymentSubmittedAt/paymentConfirmedAt, per
// that model's own doc comment), exactly mirroring the real, already-correct
// salesOrderRepository helpers used by legacyPayment.service.ts.
router.post('/purchases', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      phone,
      email,
      vehicleId,
      purchaseAmount,
      nationalId,
      color,
      address,
      bankId,
      consent,
      paymentMethod,
      quoteReference,
      visitId,
      quantity,
    } = req.body;

    if (!fullName || !phone || !vehicleId) {
      res.status(400).json({ error: 'Missing required fields: fullName, phone, vehicleId' });
      return;
    }

    // Fetch vehicle to get the model name
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const orderNo = await salesOrderRepository.nextOrderNo();
    const purchase = await prisma.salesOrder.create({
      data: {
        orderNo,
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email || null,
        vehicleModel: vehicle.name,
        totalPrice: purchaseAmount,
        configurationJson: {
          nationalId,
          color,
          address,
          bankId,
          consent,
          paymentMethod,
          quoteReference,
          visitId,
          quantity: quantity || 1,
        },
      },
    });

    // Auto-allocate the specific vehicle the customer selected (if in stock)
    if (vehicle.stock > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.vehicleAllocation.create({
          data: {
            orderId: purchase.id,
            vehicleId: vehicle.id,
            allocatedAt: new Date(),
          },
        });
        await tx.vehicle.update({
          where: { id: vehicle.id },
          data: { stock: { decrement: 1 } },
        });
      });
    }

    await seedPdiChecklist(prisma, purchase.id);
    res.status(201).json({ success: true, purchaseId: purchase.id });
  } catch (error) {
    console.error('Submit purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/purchases/:purchaseId', async (req: Request, res: Response) => {
  try {
    const purchase = await prisma.salesOrder.findUnique({ where: { id: req.params.purchaseId } });
    if (!purchase) { res.status(404).json({ error: 'Purchase not found' }); return; }
    res.json(purchase);
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/purchases/:purchaseId/payment/callback', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    // PaymentStatus enum is UNPAID | PENDING_REVIEW | PAID — normalize
    // whatever the caller sends into a valid member instead of passing an
    // arbitrary string straight through (there's also no `transactionId`
    // column on SalesOrder to persist that against).
    const paymentStatus: 'PAID' | 'PENDING_REVIEW' | 'UNPAID' = status === 'PAID' ? 'PAID' : status === 'PENDING_REVIEW' ? 'PENDING_REVIEW' : 'UNPAID';
    const purchase = await prisma.salesOrder.update({
      where: { id: req.params.purchaseId },
      data: { paymentStatus, ...(paymentStatus === 'PAID' && { paymentConfirmedAt: new Date() }) },
    });
    res.json(purchase);
  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders/:orderId/payment', async (req: Request, res: Response) => {
  try {
    const payment = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      select: { paymentStatus: true, paymentProofUrl: true, paymentSubmittedAt: true, paymentConfirmedAt: true, totalPrice: true },
    });
    if (!payment) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(payment);
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/orders/:orderId/payment/proof', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { proofUrl } = req.body;
    const payment = await salesOrderRepository.updatePaymentProof(req.params.orderId, proofUrl);
    res.status(201).json({ success: true, id: payment.id });
  } catch (error) {
    console.error('Submit payment proof error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/orders/:orderId/payment/mock-pay', async (req: Request, res: Response) => {
  try {
    // Schema comment: "the online 'pay now' mock path skips straight to
    // PAID" with no staff reviewer — exactly what this helper does.
    const payment = await salesOrderRepository.updatePaymentStatusPaid(req.params.orderId);
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/payments/direct', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const payment = await salesOrderRepository.updatePaymentStatusPaid(orderId);
    res.status(201).json({ success: true, id: payment.id });
  } catch (error) {
    console.error('Direct payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/chatbot/config', async (req: Request, res: Response) => {
  try {
    const config = await chatbotService.getConfig();
    res.json(config);
  } catch (error) {
    console.error('Get chatbot config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/chatbot/message', rateLimiters.chatbotMessage, async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'sessionId and message are required' });
      return;
    }
    const reply = await chatbotService.handleMessage(sessionId, message.trim());
    res.json(reply);
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as publicRoutes };
