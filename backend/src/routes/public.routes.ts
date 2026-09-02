import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';
import { salesOrderRepository } from '../repositories';

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
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: req.params.slug, isActive: true }, include: { brand: true, vehicleCategory: true, colors: true, accessories: true, packages: true, interiors: true, wheels: true } });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json(vehicle);
  } catch (error) {
    console.error('Get public vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:slug/configuration', async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { slug: req.params.slug, isActive: true }, include: { colors: true, accessories: true, packages: true, interiors: true, wheels: true } });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json({ colors: vehicle.colors, accessories: vehicle.accessories, packages: vehicle.packages, interiors: vehicle.interiors, wheels: vehicle.wheels });
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
      where: { isActive: true },
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
      where: { isActive: true },
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
      where: { isActive: true },
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
    res.json(setting?.value || { enabled: true, message: '' });
  } catch (error) {
    console.error('Get cookie banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/social-media', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'social_media' } });
    res.json(setting?.value || {});
  } catch (error) {
    console.error('Get social media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/site-nav', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'site_navigation' } });
    res.json(setting?.value || []);
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
    res.json(setting?.value || {});
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/business-settings', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'business_settings' } });
    res.json(setting?.value || {});
  } catch (error) {
    console.error('Get business settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicle-settings', async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'vehicle_settings' } });
    res.json(setting?.value || {});
  } catch (error) {
    console.error('Get vehicle settings error:', error);
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
    res.json(setting?.value || {});
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

router.get('/status', async (req: Request, res: Response) => {
  try {
    const { type, reference } = req.query;
    res.json({ type, reference, status: 'unknown' });
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
      prisma.newsArticle.findMany({ where: { status: 'published' }, orderBy: { publishDate: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, title: true, author: true, excerpt: true, imageUrl: true, publishDate: true, createdAt: true, category: true } }),
      prisma.newsArticle.count({ where: { status: 'published' } }),
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
    if (!article || article.status !== 'published') { res.status(404).json({ error: 'Article not found' }); return; }
    await prisma.newsArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
    const related = await prisma.newsArticle.findMany({
      where: { id: { not: article.id }, category: article.category, status: 'published' },
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
    const quotation = await prisma.quotation.create({ data: req.body });
    res.status(201).json({ success: true, reference: quotation.reference });
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
    res.json(quotation);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/quotations/:reference/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { signatureData } = req.body;
    const quotation = await prisma.quotation.findFirst({ where: { reference: req.params.reference } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    // NOTE: `signatureData`/`signerName` -> Quotation has no such fields.
    // The real field for a customer's e-sign/attach is `signedDocumentUrl`
    // (schema comment: "Setting this also flips status to 'accepted'").
    // `signerName` has no equivalent column on this model — dropped.
    const updated = await prisma.quotation.update({ where: { id: quotation.id }, data: { status: 'accepted', signedAt: new Date(), signedDocumentUrl: signatureData } });
    res.json(updated);
  } catch (error) {
    console.error('Sign quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/quotations/:reference/pdf', async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findFirst({ where: { reference: req.params.reference } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    // NOTE: Quotation has no stored `pdfUrl` — the quotation PDF is
    // generated on demand (see quotationPdf.service.ts), and the only
    // stored document link is `signedDocumentUrl` once the customer signs.
    res.json({ quotation, pdfUrl: quotation.signedDocumentUrl });
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
    const page = await prisma.servicePage.findFirst({ where: { slug: req.params.slug, isPublished: true } });
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
    const programs = await prisma.financingProgram.findMany({ where: { status: 'PUBLISHED' } });
    res.json(programs);
  } catch (error) {
    console.error('List financing programs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/financing-banks', async (req: Request, res: Response) => {
  try {
    // NOTE: was `prisma.bank` — the real model is `FinancingBank`.
    const banks = await prisma.financingBank.findMany({ where: { isActive: true } });
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
    const orderNo = await salesOrderRepository.nextOrderNo();
    const purchase = await prisma.salesOrder.create({ data: { ...req.body, orderNo } });
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

export { router as publicRoutes };
