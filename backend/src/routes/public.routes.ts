import { Router, Request, Response } from 'express';
import type { SiteNavPlacement } from '@prisma/client';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';
import { salesOrderRepository, vehicleRepository } from '../repositories';
import { quotationPdfService } from '../services/sales/quotationPdf.service';
import { orderService } from '../services/sales/order.service';
import { orderInvoiceService } from '../services/sales/orderInvoice.service';
import { convertQuotationToOrderService } from '../services/sales/convertQuotationToOrder.service';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { sendPartsRequestConfirmationEmail, sendRoadsideAssistanceConfirmationEmail } from '../services/email/statusEmail';
import { userRepository } from '../repositories';
import { env } from '../config/env';
import { verifyLinkToken } from '../utils/secureLink';
import { validateGenericIdOrLicense } from '../utils/idValidation';
import { generateReference, REFERENCE_CATEGORY } from '../utils/reference';
import { persistQuotationPdfSnapshot } from './quotations.routes';
import { auditService } from '../services/audit/audit.service';
import { serviceBookingService } from '../services/serviceBookings/serviceBooking.service';
import { loyaltyService } from '../services/loyalty/loyalty.service';

let cachedManagerEmails: string[] | null = null;
let managerEmailsCachedAt = 0;
const MANAGER_EMAIL_CACHE_TTL = 5 * 60 * 1000;

// Combined draft/scheduled/published visibility gate (see `ContentStatus` in
// prisma/schema.prisma) for HeroSection, FAQ, VehicleShowcase, and
// SiteNavItem. This is ADDITIONAL to each model's own isActive/
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
import { chatbotService } from '../services/chatbot/chatbot.service';

const router = Router();

router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { isActive: true, status: 'published' }, include: { brand: true, vehicleCategory: true, colors: true }, orderBy: { displayOrder: 'asc' } });
    res.json(vehicles);
  } catch (error) {
    console.error('List public vehicles error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:slug', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: req.params.slug, isActive: true, status: 'published' }, include: { brand: true, vehicleCategory: true, colors: true, packages: true, interiors: true } });
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
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: req.params.slug, isActive: true, status: 'published' }, include: { colors: true, packages: true, interiors: true } });
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
    const category = await prisma.vehicleCategory.findFirst({ where: { slug: req.params.slug, isActive: true }, include: { vehicles: { where: { isActive: true, status: 'published' } } } });
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

// Public counterpart of GET/PUT /api/admin/content/geely-team
// (backend/src/routes/admin-content.routes.ts) — same `geely_team` Setting
// key, same { members: [...] } shape, no auth.
router.get('/geely-team', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'geely_team' } });
    const parsed = setting?.value ? JSON.parse(setting.value) : { members: [] };
    res.json({ members: parsed.members || [] });
  } catch (error) {
    console.error('Get public Geely Team error:', error);
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
    const { vehicleId } = req.query;
    const showcases = await prisma.vehicleShowcase.findMany({
      where: {
        isActive: true,
        ...(typeof vehicleId === 'string' ? { vehicleId } : {}),
        ...publishedOrDue(),
      },
      orderBy: { sortOrder: 'asc' },
    });
    // VehicleShowcase.vehicleId is a loose string reference (no Prisma
    // relation), so it never carries the vehicle's slug — without this,
    // the frontend's link fallback (when a showcase has no explicit
    // ctaLink) has only the vehicleId to build a /models/:slug URL from,
    // which 404s since that route looks vehicles up by slug, not id.
    const vehicleIds = [...new Set(showcases.map((s) => s.vehicleId))];
    const vehicles = vehicleIds.length
      ? await prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, select: { id: true, slug: true } })
      : [];
    const slugById = new Map(vehicles.map((v) => [v.id, v.slug]));
    res.json(showcases.map((s) => ({ ...s, vehicleSlug: slugById.get(s.vehicleId) ?? null })));
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
// Message), plus SalesOrder below by its own `orderNo` (format `SO-<n>`,
// distinct from the `GY-<CAT>-...` reference shape the other categories
// use — orderService.getStatusByOrderNo/salesOrderRepository.
// findByOrderNoForStatus already existed correctly but had no route calling
// them until now). Financing (FinancingApplication) and Trade-In
// (TradeInEvaluation) still have no reference column to look up by, so
// those categories report not-found rather than guessing.
router.get('/status', async (req: Request, res: Response) => {
  try {
    const ref = (req.query.ref as string || '').trim();
    if (!ref) { res.json({ found: false, error: 'A reference number is required.' }); return; }

    if (ref.startsWith('SO-')) {
      const orderResult = await orderService.getStatusByOrderNo(ref);
      if (!orderResult.ok || !orderResult.data) { res.json({ found: false, error: 'No order found for that reference number.' }); return; }
      res.json({
        found: true,
        result: {
          type: 'order',
          label: 'Sales Order',
          reference: ref,
          status: orderResult.data.status,
          createdAt: orderResult.data.createdAt,
          vehicleModel: orderResult.data.vehicleModel,
        },
      });
      return;
    }

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
    const featuredOnly = req.query.featured === 'true';
    const limit = parseInt(req.query.limit as string, 10);
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        ...(featuredOnly ? { isFeatured: true } : {}),
      },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
      ...(Number.isFinite(limit) && limit > 0 ? { take: limit } : {}),
    });
    res.json({ success: true, promotions });
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
    const [content, brands, categories, benefits, parts] = await Promise.all([
      prisma.partsPageContent.findFirst(),
      prisma.partBrand.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.partCategory.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.partBenefit.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }),
      prisma.sparePart.findMany({
        where: { isActive: true },
        include: { partCategory: true },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
      }),
    ]);
    res.json({ success: true, content: content || {}, brands, categories, benefits, parts });
  } catch (error) {
    console.error('Get parts page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/parts/requests', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.partsRequest` (typo) — the real model is `PartRequest`.
    // It also used to pass req.body straight through: PartRequest.items is a
    // relation to PartRequestItem, not a JSON/array column, so the cart array
    // apps/web/app/parts/page.tsx sends (partId/partName/partSku/unitPrice/
    // quantity per line) always threw a Prisma validation error — every
    // "Request Quote" submission 500'd. Needs the nested `create` write
    // syntax instead, plus the reference code this model's own schema
    // comment says it should get (every other lead-capture flow in this
    // file does the same).
    const { name, company, phone, email, address, notes, items } = req.body ?? {};
    if (!name || !phone || !email) {
      res.status(400).json({ error: 'Name, phone, and email are required.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one part is required.' });
      return;
    }

    const reference = await generateReference(REFERENCE_CATEGORY.PARTS_REQUEST);
    const request = await prisma.partRequest.create({
      data: {
        name,
        company: company || null,
        phone,
        email,
        address: address || null,
        notes: notes || null,
        reference,
        items: {
          create: items.map((item: any) => ({
            partId: item.partId || null,
            partName: item.partName,
            partSku: item.partSku || null,
            unitPrice: Number(item.unitPrice) || 0,
            quantity: Number(item.quantity) || 1,
          })),
        },
      },
    });
    let notificationSent = true;
    try {
      await sendPartsRequestConfirmationEmail({
        to: email,
        customerName: name,
        reference,
        items: items.map((item: any) => ({
          partName: item.partName,
          partSku: item.partSku,
          unitPrice: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 1,
        })),
      });

      const notifyEmails = await userRepository.findWorkshopManagerEmails();
      await dispatchNotification({
        type: 'parts_request',
        to: [...new Set(notifyEmails)],
        subject: `New Parts Quote Request — ${reference}`,
        data: {
          reference,
          customerName: name,
          phone,
          itemCount: items.length,
        },
        ctas: [{ label: 'View Request', url: `${env.urls.admin}/admin/parts-requests` }],
        inApp: {
          type: 'parts_request',
          title: 'New Parts Quote Request',
          body: `${name} requested a quote for ${items.length} part${items.length === 1 ? '' : 's'} (${reference}).`,
          link: '/admin/parts-requests',
          relatedModel: 'partRequest',
          relatedId: request.id,
          priority: 'normal',
        },
      });
    } catch (notifyError: any) {
      notificationSent = false;
      console.error('[PARTS REQUEST NOTIFICATION ERROR]', notifyError.message);
    }

    res.status(201).json({ success: true, id: request.id, reference, notificationSent });
  } catch (error) {
    console.error('Submit parts request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/public/roadside-requests — apps/web/app/roadside's "Request
// Assistance" form used to be entirely fake (a setTimeout + console.log, no
// backend call at all), so no real request was ever recorded, dispatched,
// or notified to staff. This is the emergency-flavored equivalent of
// /parts/requests and /service-bookings — always notifies workshop/service
// staff (that must never silently fail), and additionally emails the
// customer a confirmation when they provided one (the form's core fields
// are name/phone, not email, since phone is what dispatch actually needs).
router.post('/roadside-requests', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const {
      firstName, lastName, phone, alternatePhone, email,
      currentLocation, landmark, city,
      vehicleModel, plateNumber, color,
      issueType, issueDescription, isVehicleSafe, passengersCount,
      hasMembership, membershipNumber,
    } = req.body ?? {};

    if (!firstName || !lastName || !phone || !currentLocation || !issueType) {
      res.status(400).json({ error: 'Name, phone, location, and issue type are required.' });
      return;
    }

    const reference = await generateReference(REFERENCE_CATEGORY.ROADSIDE_ASSISTANCE);
    const request = await prisma.roadsideAssistanceRequest.create({
      data: {
        firstName,
        lastName,
        phone,
        alternatePhone: alternatePhone || null,
        currentLocation,
        landmark: landmark || null,
        city: city || 'Unspecified',
        vehicleModel: vehicleModel || 'Unspecified',
        plateNumber: plateNumber || 'Unspecified',
        color: color || 'Unspecified',
        issueType,
        issueDescription: issueDescription || '',
        isVehicleSafe: isVehicleSafe === 'yes' || isVehicleSafe === true,
        passengersCount: passengersCount || '0',
        hasMembership: hasMembership === 'yes' || hasMembership === true,
        membershipNumber: membershipNumber || null,
        reference,
      },
    });

    const customerName = `${firstName} ${lastName}`;
    const vehicleInfo = [color, vehicleModel, plateNumber ? `(${plateNumber})` : ''].filter(Boolean).join(' ');

    let notificationSent = true;
    try {
      const notifyEmails = await userRepository.findWorkshopManagerEmails();
      await dispatchNotification({
        type: 'roadside_request',
        to: [...new Set(notifyEmails)],
        subject: `🚨 Roadside Assistance Requested — ${reference}`,
        data: {
          reference,
          customerName,
          phone,
          issueType,
          currentLocation,
          vehicleInfo,
          isVehicleSafe: isVehicleSafe === 'yes' || isVehicleSafe === true ? 'Yes' : 'No — needs urgent attention',
        },
        ctas: [{ label: 'View Request', url: `${env.urls.admin}/admin/roadside-requests` }],
        inApp: {
          type: 'roadside_request',
          title: 'New Roadside Assistance Request',
          body: `${customerName} needs help with ${issueType} at ${currentLocation} (${reference}).`,
          link: '/admin/roadside-requests',
          relatedModel: 'roadsideAssistanceRequest',
          relatedId: request.id,
          priority: 'high',
        },
      });

      if (email) {
        await sendRoadsideAssistanceConfirmationEmail({
          to: email,
          customerName,
          reference,
          currentLocation,
          issueType,
          vehicleInfo,
          emergencyPhone: '+251 99 338 9874',
        });
      }
    } catch (notifyError: any) {
      notificationSent = false;
      console.error('[ROADSIDE REQUEST NOTIFICATION ERROR]', notifyError.message);
    }

    res.status(201).json({ success: true, id: request.id, reference, notificationSent });
  } catch (error) {
    console.error('Submit roadside request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/trade-in', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // Trade-in is one of the interest flags on the `Quotation` lead model
    // (tradeInInterest: Boolean), same as every other lead-capture flow in
    // this file — but the actual vehicle-condition/mileage/photo detail the
    // public /trade-in form collects (apps/web/app/trade-in/page.tsx) has no
    // matching columns on Quotation itself, so it's captured on a linked
    // TradeInEvaluation row instead (see Quotation.tradeInEvaluationId).
    // Previously this spread the raw request body straight into
    // prisma.quotation.create(), which has no `firstName`/`currentMake`/
    // `currentMileage`/etc. columns — every real submission threw.
    const {
      firstName, lastName, email, phone, nationalId,
      currentMake, currentModel, currentYear, currentMileage, currentCondition, vin,
      hasAccidents, hasModifications, serviceHistory,
      interestedModel, purchaseTimeframe, financingNeeded,
      additionalInfo, photoUrls,
    } = req.body || {};

    if (nationalId) {
      const idError = validateGenericIdOrLicense(nationalId);
      if (idError) { res.status(400).json({ error: idError }); return; }
    }

    const customerName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (!customerName || !phone) {
      res.status(400).json({ error: 'Name and phone number are required.' });
      return;
    }

    const yearNum = parseInt(currentYear, 10);
    const mileageNum = parseInt(currentMileage, 10);
    // hasAccidents/hasModifications come from the public form as
    // 'no' | 'minor' | 'major' selects, not raw booleans — the model's
    // fields are a coarse yes/no flag, so the severity detail is folded
    // into serviceHistoryNotes instead of being discarded.
    const hadAccidents = Boolean(hasAccidents) && hasAccidents !== 'no';
    const hadModifications = Boolean(hasModifications) && hasModifications !== 'no';
    const historyNote = [
      hadAccidents ? `Accidents: ${hasAccidents}` : null,
      hadModifications ? `Modifications: ${hasModifications}` : null,
      serviceHistory ? `Service history: ${serviceHistory}` : null,
    ].filter(Boolean).join(' · ') || undefined;

    const evaluation = await prisma.tradeInEvaluation.create({
      data: {
        vin: vin || undefined,
        year: Number.isFinite(yearNum) ? yearNum : new Date().getFullYear(),
        make: currentMake || undefined,
        model: currentModel || undefined,
        mileage: Number.isFinite(mileageNum) ? mileageNum : 0,
        condition: currentCondition || 'good',
        hasAccidents: hadAccidents,
        hasModifications: hadModifications,
        serviceHistoryNotes: historyNote,
        photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
      },
    });

    const reference = await generateReference(REFERENCE_CATEGORY.TRADE_IN);
    const tradeIn = await prisma.quotation.create({
      data: {
        customerName,
        phoneNumber: phone,
        email: email || undefined,
        nationalId: nationalId || undefined,
        vehicleModel: interestedModel || undefined,
        financingInterest: financingNeeded === 'yes',
        tradeInInterest: true,
        source: 'trade-in',
        message: [additionalInfo, purchaseTimeframe ? `Purchase timeframe: ${purchaseTimeframe}` : null]
          .filter(Boolean)
          .join('\n') || undefined,
        reference,
        tradeInEvaluationId: evaluation.id,
      },
    });

    res.status(201).json({ success: true, id: tradeIn.id, reference: tradeIn.reference });
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
    if (quotation.signedAt) {
      res.status(409).json({ error: 'This quotation has already been signed.' });
      return;
    }
    if (!signatureData || typeof signatureData !== 'string') {
      res.status(400).json({ error: 'A signature is required.' });
      return;
    }
    let updated = await prisma.quotation.update({ where: { id: quotation.id }, data: { status: 'accepted', signedAt: new Date(), signedDocumentUrl: signatureData } });

    // Snapshot the fully-signed PDF (manager + customer signatures embedded)
    // so pdfUrl holds the exact locked document, not just a live-render URL.
    try {
      const pdfResult = await quotationPdfService.generatePdf(quotation.id);
      if (pdfResult.ok && pdfResult.data) {
        const snapshotUrl = persistQuotationPdfSnapshot(quotation.id, pdfResult.data);
        updated = await prisma.quotation.update({ where: { id: quotation.id }, data: { pdfUrl: snapshotUrl } });
      }
    } catch (snapshotError: any) {
      console.error('[QUOTATION SIGN PDF SNAPSHOT ERROR]', snapshotError.message);
    }

    await auditService.log({
      entityType: 'quotation',
      entityId: quotation.id,
      action: 'customer_signed_locked',
      performedById: 'customer',
      performedByName: quotation.customerName,
    });

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
        ctas: [{ label: 'View Sales Order', url: `${env.urls.admin}/admin/orders/${order.id}` }],
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
    const { customerName, customerEmail, customerPhone, vehicleModel, vehiclePrice, requestedAmount, downPayment, tenureMonths, interestRate, ...rest } = req.body || {};

    if (!customerName || !customerPhone || !vehicleModel) {
      res.status(400).json({ error: 'customerName, customerPhone, and vehicleModel are required.' });
      return;
    }

    // Create a Lead first (required by FinancingApplication.leadId)
    const lead = await prisma.lead.create({
      data: {
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        vehicleModel,
        source: 'website',
        financingInterest: true,
        status: 'new',
        ...rest,
      },
    });

    // Create the FinancingApplication linked to this lead
    const application = await prisma.financingApplication.create({
      data: {
        leadId: lead.id,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        vehicleModel,
        vehiclePrice: vehiclePrice || 0,
        requestedAmount: requestedAmount || 0,
        downPayment: downPayment || 0,
        tenureMonths: tenureMonths || 36,
        interestRate: interestRate || 0,
        status: 'PENDING',
      },
    });

    try {
      const managerEmails = await getManagerEmails();
      if (managerEmails.length > 0) {
        await dispatchNotification({
          type: 'financing_application',
          to: managerEmails,
          subject: `New Financing Application — ${vehicleModel}`,
          data: {
            customerName,
            customerPhone,
            vehicleModel,
            requestedAmount: requestedAmount || 0,
            adminLink: `${env.urls.admin}/admin/financing?tab=applications`,
          },
          ctas: [{ label: 'Review Application', url: `${env.urls.admin}/admin/financing?tab=applications` }],
        });
      }
      if (customerEmail) {
        await dispatchNotification({
          type: 'financing_application',
          to: [customerEmail],
          subject: `Financing Application Received — ${vehicleModel}`,
          data: {
            message: `We've received your financing application for the ${vehicleModel}. Our finance team will review it and get back to you shortly.`,
          },
          greetingName: customerName,
        });
      }
    } catch (notifyError: any) {
      console.error('[FINANCING APPLICATION NOTIFICATION ERROR]', notifyError.message);
    }

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

    if (nationalId) {
      const idError = validateGenericIdOrLicense(nationalId);
      if (idError) { res.status(400).json({ error: idError }); return; }
    }

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
    if (req.body?.nationalId) {
      const idError = validateGenericIdOrLicense(req.body.nationalId);
      if (idError) { res.status(400).json({ error: idError }); return; }
    }

    const { firstName, lastName, email, phone, nationalId, vehicleModel, vehicleYear, mileage, vin, serviceType, preferredDate, preferredTime, location, description } = req.body;

    const customerName = [firstName, lastName].filter(Boolean).join(' ') || req.body.customerName || '';
    const customerPhone = phone || req.body.customerPhone || '';
    const vehicleInfo = [vehicleModel, vehicleYear ? `(${vehicleYear})` : ''].filter(Boolean).join(' ') || req.body.vehicleInfo || '';

    const result = await serviceBookingService.create({
      customerName,
      customerPhone,
      customerEmail: email || '',
      nationalId: nationalId || undefined,
      serviceType: serviceType || '',
      vehicleInfo,
      date: preferredDate || req.body.date || new Date().toISOString(),
      timeSlot: preferredTime || undefined,
      vehicleYear: vehicleYear || undefined,
      mileage: mileage || undefined,
      vin: vin || undefined,
      location: location || undefined,
      notes: description || undefined,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ success: true, reference: result.data.reference, bookingId: result.data.id });
  } catch (error) {
    console.error('Submit service booking error:', error);
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
    if (nationalId) {
      const idError = validateGenericIdOrLicense(nationalId);
      if (idError) { res.status(400).json({ error: idError }); return; }
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

    // PDI checklist is seeded once a vehicle is actually allocated to the
    // order (see vehicleAllocationService.lockAllocation) — the reservation
    // above only reserves a stock unit, it doesn't lock a specific VIN yet.
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
    // SalesOrder has no dedicated transactionId/bank/paymentReference columns —
    // a "purchase" here just is the order, so surface its real fields under
    // the names the payment-success page displays (orderNo doubles as the
    // reference, and the configurationJson.bankId captured at submission
    // time, if present, is resolved to its bank name).
    const config = (purchase.configurationJson as Record<string, unknown> | null) || {};
    const bankId = typeof config.bankId === 'string' ? config.bankId : null;
    const bank = bankId ? await prisma.financingBank.findUnique({ where: { id: bankId } }) : null;
    res.json({
      purchase: {
        vehicle: purchase.vehicleModel,
        amount: purchase.totalPrice != null ? purchase.totalPrice.toLocaleString() : '',
        bank: bank?.name || (typeof config.paymentMethod === 'string' ? config.paymentMethod : 'N/A'),
        transactionId: purchase.id,
        paymentReference: purchase.orderNo,
        paymentStatus: purchase.paymentStatus,
        purchaseStatus: purchase.status,
      },
    });
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

// The emailed payment link (see POST /api/orders/:id/countersign, which is
// the only place a 'payment' token is ever minted) is only sent once a
// manager has countersigned the agreement. Verifying the token here — and
// re-checking countersignedAt itself — makes that a real precondition on
// these endpoints instead of just "we didn't email the link early."
function guardPaymentAccess(order: { countersignedAt: Date | null } | null, token: unknown, orderId: string, res: Response): boolean {
  if (!order) { res.status(404).json({ error: 'Order not found' }); return false; }
  if (!verifyLinkToken(typeof token === 'string' ? token : undefined, 'payment', orderId)) {
    res.status(403).json({ error: 'Invalid or expired link.' });
    return false;
  }
  if (!order.countersignedAt) {
    res.status(403).json({ error: 'This order is awaiting manager countersignature before payment can proceed.' });
    return false;
  }
  return true;
}

router.get('/orders/:orderId/payment', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      select: { paymentStatus: true, paymentProofUrl: true, paymentSubmittedAt: true, paymentConfirmedAt: true, paymentVerifiedAt: true, totalPrice: true, amountPaid: true, countersignedAt: true },
    });
    if (!guardPaymentAccess(order, req.query.token, req.params.orderId, res)) return;
    const { countersignedAt, ...payment } = order!;
    const outstandingAmount = (payment.totalPrice ?? 0) - (payment.amountPaid ?? 0);
    res.json({ ...payment, outstandingAmount });
  } catch (error) {
    console.error('Get order payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/orders/:orderId/payment/proof', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId }, select: { countersignedAt: true } });
    if (!guardPaymentAccess(order, req.query.token, req.params.orderId, res)) return;
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
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId }, select: { countersignedAt: true, totalPrice: true, amountPaid: true } });
    if (!guardPaymentAccess(order, req.query.token, req.params.orderId, res)) return;
    // Schema comment: "the online 'pay now' mock path skips straight to
    // PAID" with no staff reviewer — exactly what this helper does. Record
    // method/reference/amount atomically at the moment of success, instead
    // of leaving them to be entered later, disconnected, during invoicing.
    const outstanding = (order!.totalPrice ?? 0) - (order!.amountPaid ?? 0);
    const payment = await salesOrderRepository.updatePaymentStatusPaid(req.params.orderId, {
      paymentMethod: 'online',
      paymentReferenceNo: `TXN-${Date.now()}`,
      amountPaid: (order!.amountPaid ?? 0) + outstanding,
    });
    res.json({ success: true, payment });
  } catch (error) {
    console.error('Mock payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/orders/:orderId/invoice?token=... — customer self-serve
// download, same token-gated pattern as /payment and /agreement above.
router.get('/orders/:orderId/invoice', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!verifyLinkToken(typeof req.query.token === 'string' ? req.query.token : undefined, 'invoice', req.params.orderId)) {
      res.status(403).json({ error: 'Invalid or expired link.' });
      return;
    }
    if (!order.invoicedAt) { res.status(404).json({ error: 'Invoice not available yet.' }); return; }

    const result = await orderInvoiceService.generateInvoicePdf(order.id);
    if (!result.ok || !result.data) { res.status(500).json({ error: result.error || 'Failed to generate invoice PDF' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${order.invoiceNo}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Get public invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/public/orders/:orderId/receipt?token=... — customer self-serve
// payment receipt download, same token-gated pattern as /invoice above.
router.get('/orders/:orderId/receipt', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!verifyLinkToken(typeof req.query.token === 'string' ? req.query.token : undefined, 'receipt', req.params.orderId)) {
      res.status(403).json({ error: 'Invalid or expired link.' });
      return;
    }
    if (!order.paymentVerifiedAt) { res.status(404).json({ error: 'Receipt not available yet.' }); return; }

    const result = await orderInvoiceService.generateReceiptPdf(order.id);
    if (!result.ok || !result.data) { res.status(500).json({ error: result.error || 'Failed to generate receipt PDF' }); return; }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-${order.orderNo}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Get public receipt error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET/POST /api/public/orders/:orderId/delivery-schedule?token=... — customer
// picks a handover date/time once the order is READY_FOR_DELIVERY, same
// token-gated pattern as /payment and /agreement above.
router.get('/orders/:orderId/delivery-schedule', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      select: { orderNo: true, customerName: true, vehicleModel: true, status: true, deliveryScheduledAt: true, deliveryLocation: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!verifyLinkToken(typeof req.query.token === 'string' ? req.query.token : undefined, 'delivery-schedule', req.params.orderId)) {
      res.status(403).json({ error: 'Invalid or expired link.' });
      return;
    }
    res.json(order);
  } catch (error) {
    console.error('Get delivery schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/orders/:orderId/delivery-schedule', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!verifyLinkToken(typeof req.query.token === 'string' ? req.query.token : undefined, 'delivery-schedule', req.params.orderId)) {
      res.status(403).json({ error: 'Invalid or expired link.' });
      return;
    }
    if (order.status !== 'READY_FOR_DELIVERY' && order.status !== 'DELIVERED') {
      res.status(400).json({ error: 'This order is not yet ready for delivery scheduling.' });
      return;
    }
    const { scheduledAt } = req.body ?? {};
    const parsed = scheduledAt ? new Date(scheduledAt) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) { res.status(400).json({ error: 'A valid delivery date/time is required.' }); return; }

    const updated = await prisma.salesOrder.update({ where: { id: order.id }, data: { deliveryScheduledAt: parsed } });

    const managerEmails = await userRepository.findManagerEmails();
    const agent = order.salesAgentId ? await userRepository.findById(order.salesAgentId) : null;
    const recipients = [order.customerEmail, agent?.email, ...managerEmails].filter((e): e is string => Boolean(e));
    if (recipients.length > 0) {
      await dispatchNotification({
        type: 'delivery_scheduled',
        to: recipients,
        subject: `Delivery Scheduled — ${order.orderNo}`,
        data: {
          orderNo: order.orderNo,
          vehicleModel: order.vehicleModel,
          customerName: order.customerName,
          scheduledAt: parsed.toLocaleString(),
          deliveryLocation: order.deliveryLocation ?? 'To be confirmed',
        },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Schedule delivery error:', error);
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

const CHATBOT_MAX_MESSAGE_LENGTH = 1000;

router.post('/chatbot/message', rateLimiters.chatbotMessage, async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'sessionId and message are required' });
      return;
    }
    if (message.length > CHATBOT_MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `Message is too long (max ${CHATBOT_MAX_MESSAGE_LENGTH} characters).` });
      return;
    }
    const reply = await chatbotService.handleMessage(sessionId, message.trim());
    res.json(reply);
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Loyalty (public lookup by phone) ──────────────────────────────────────

router.get('/loyalty/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required.' });
      return;
    }

    const result = await loyaltyService.getByPhone(phone);

    if (!result.ok) {
      res.status(500).json({ error: result.error });
      return;
    }

    if (!result.data) {
      res.json({ exists: false, points: 0, tier: 'BRONZE', transactions: [] });
      return;
    }

    res.json({
      exists: true,
      points: result.data.points,
      tier: result.data.tier,
      benefits: loyaltyService.getTierBenefits()[result.data.tier] || [],
      transactions: result.data.transactions.map((t: any) => ({
        points: t.points,
        reason: t.reason,
        sourceType: t.sourceType,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error('Public loyalty lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Service history (public lookup by phone) ──────────────────────────────

router.get('/service-history/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ error: 'Phone number is required.' });
      return;
    }

    const bookings = await prisma.serviceBooking.findMany({
      where: { customerPhone: phone },
      select: {
        id: true,
        reference: true,
        serviceType: true,
        vehicleInfo: true,
        date: true,
        timeSlot: true,
        status: true,
        technician: true,
        location: true,
        createdAt: true,
        jobCard: { select: { id: true, jobCardNo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Public service history lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as publicRoutes };
