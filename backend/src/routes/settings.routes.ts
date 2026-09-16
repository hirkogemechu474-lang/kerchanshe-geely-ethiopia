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

// GET/POST /api/settings/financing-settings — calculator defaults, eligibility
// requirements, fee schedule, and support contact for the /financing page.
// Registered before the generic '/:key' route for the same shadowing reason
// as the settings pairs above. Unlike those, FinancingSettingsEditor.tsx does
// NOT defensively merge against its own client-side defaults on load
// (`setSettings(data)` is used as-is) — so unlike an empty `{}` fallback,
// GET must always return this same fully-populated default shape when unset,
// or the editor's nested field reads (settings.calculator.enabled, etc.)
// throw immediately.
const DEFAULT_FINANCING_SETTINGS = {
  enabled: true,
  calculator: {
    enabled: true,
    defaultDownPayment: 20,
    minDownPayment: 10,
    maxDownPayment: 80,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 7,
    tenureOptions: [1, 2, 3, 4, 5, 6, 7],
    defaultInterestRate: 13.5,
    interestRateRange: { min: 12.5, max: 15.5 },
  },
  requirements: {
    ethiopianCitizenship: true,
    minAge: 21,
    maxAge: 65,
    minMonthlyIncome: 15000,
    employmentRequired: true,
    minEmploymentYears: 1,
    documents: [
      'Valid Ethiopian ID or Passport',
      'Proof of Income (Salary slip or Bank statement for 3-6 months)',
      'Employment Letter / Contract',
      'Proof of Residence (Utility bill, Lease agreement)',
      'Completed Application Form',
      'Down Payment Receipt',
      'TIN (Tax Identification Number)',
      'Two Recent Passport Photos',
      'Bank account statement (latest 6 months)',
      'Credit Bureau report (if applicable)',
    ],
  },
  process: {
    steps: [
      { step: 1, title: 'Calculate & Estimate', description: 'Use our online calculator to estimate monthly payments based on vehicle price, down payment, and preferred loan term.', duration: '5 minutes' },
      { step: 2, title: 'Submit Application', description: 'Complete the financing application form online or at any showroom. Submit all required documentation for initial review.', duration: '1-2 hours' },
      { step: 3, title: 'Document Verification', description: 'The bank verifies your employment, income, and submitted documents. A credit check may also be performed.', duration: '1-2 business days' },
      { step: 4, title: 'Loan Approval', description: 'Upon successful verification, the bank approves your loan and issues a sanction letter with approved terms and conditions.', duration: '2-3 business days' },
      { step: 5, title: 'Sign Agreement & Pay Down Payment', description: 'Review and sign the loan agreement. Pay the down payment amount and any processing fees to complete the purchase.', duration: '1 day' },
      { step: 6, title: 'Vehicle Delivery', description: 'Once all paperwork is complete and payment is confirmed, you can take delivery of your new Geely vehicle!', duration: 'Same day' },
    ],
    totalDuration: '3-5 business days',
    fastTrackAvailable: true,
    fastTrackDuration: '2 business days',
  },
  fees: {
    processingFee: { percentage: 2.5, min: 5000, max: 30000 },
    insurance: {
      comprehensive: { percentage: 5, description: 'Full comprehensive insurance covering theft, accident, fire, and third-party liability.' },
      thirdParty: { fixed: 3500, description: 'Basic third-party liability insurance as required by Ethiopian law.' },
    },
    registration: { plates: 1800, license: 600, inspection: 1200 },
  },
  additionalInfo: {
    latePaymentPenalty: 2,
    earlyRepaymentAllowed: true,
    earlyRepaymentPenalty: 1,
    gracePeriod: 7,
    maxMissedPayments: 3,
    balloonPaymentAvailable: false,
  },
  support: {
    phone: '+251 99 338 9874',
    email: 'financing@geely-ethiopia.com',
    whatsapp: '+251 99 338 9874',
    consultationAvailable: true,
    consultationFree: true,
  },
};

router.get('/financing-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'financing_settings' } });
    if (!setting?.value) { res.json(DEFAULT_FINANCING_SETTINGS); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json(DEFAULT_FINANCING_SETTINGS);
    }
  } catch (error) {
    console.error('Get financing settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/financing-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'financing_settings' },
      update: { value },
      create: { key: 'financing_settings', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update financing settings error:', error);
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

// The About editor works with the JSON content directly rather than the
// database setting wrapper returned by the generic route below.
router.get('/about', requireAdminApiSession, async (_req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'about_page' } });
    res.json(setting?.value ? JSON.parse(setting.value) : {});
  } catch (error) {
    console.error('Get about settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/about', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'about_page' },
      update: { value },
      create: { key: 'about_page', value, type: 'general' },
    });
    res.json(JSON.parse(setting.value));
  } catch (error) {
    console.error('Update about settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET/POST /api/settings/vehicle-settings, vehicle-specifications,
// vehicle-features, document-signatures, warranty-page, cookie-banner,
// notification-rules, assignment-rules, and ev-savings-calculator below —
// registered before the generic '/:key' routes for the same reason as
// social-media/policies/business-settings/contact-information/bank-details
// above: the admin pages for these all POST the raw settings object
// directly and read the GET response as that same raw object, but the
// generic '/:key' handler expects a `{ value: "..." }` body and returns the
// raw Setting row (value still JSON-stringified) — so before these existed,
// saves here were silently writing an empty string and reads never saw real
// data. Same JSON.stringify(req.body)/JSON.parse(setting.value) convention,
// keyed to match what public.routes.ts / assignSalesRep.ts already read.

router.get('/vehicle-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'vehicle_settings' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get vehicle settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'vehicle_settings' },
      update: { value },
      create: { key: 'vehicle_settings', value, type: 'vehicle' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update vehicle settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicle-specifications', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'vehicle_specifications' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get vehicle specifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-specifications', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'vehicle_specifications' },
      update: { value },
      create: { key: 'vehicle_specifications', value, type: 'vehicle' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update vehicle specifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicle-features', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'vehicle_features' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get vehicle features error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicle-features', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'vehicle_features' },
      update: { value },
      create: { key: 'vehicle_features', value, type: 'vehicle' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update vehicle features error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/document-signatures', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'document_signatures' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get document signatures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/document-signatures', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'document_signatures' },
      update: { value },
      create: { key: 'document_signatures', value, type: 'sales' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update document signatures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/warranty-page', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'warranty_page' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get warranty page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/warranty-page', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'warranty_page' },
      update: { value },
      create: { key: 'warranty_page', value, type: 'content' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update warranty page error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cookie-banner', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'cookie_banner' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get cookie banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/cookie-banner', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'cookie_banner' },
      update: { value },
      create: { key: 'cookie_banner', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update cookie banner error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notification-rules', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'notification_rules' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get notification rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/notification-rules', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'notification_rules' },
      update: { value },
      create: { key: 'notification_rules', value, type: 'sales' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update notification rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Key is 'assignment_rules', matching backend/src/services/sales/assignSalesRep.ts's
// getAssignmentRules(), which reads this setting to weight auto-assignment —
// this was previously unreachable/unsaveable via the generic '/:key' route.
router.get('/assignment-rules', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'assignment_rules' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get assignment rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/assignment-rules', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'assignment_rules' },
      update: { value },
      create: { key: 'assignment_rules', value, type: 'sales' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update assignment rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Key is 'ev_calculator' (not 'ev_savings_calculator'), matching the existing
// key public.routes.ts's GET /ev-savings-calculator already reads.
router.get('/ev-savings-calculator', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'ev_calculator' } });
    if (!setting?.value) { res.json({}); return; }
    try {
      res.json(JSON.parse(setting.value));
    } catch {
      res.json({});
    }
  } catch (error) {
    console.error('Get EV savings calculator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/ev-savings-calculator', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'ev_calculator' },
      update: { value },
      create: { key: 'ev_calculator', value, type: 'content' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update EV savings calculator error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET/POST /api/settings/seo-settings — default meta title/description, OG
// image URL, Twitter handle, default keywords, Google Analytics 4 ID, Google
// Search Console verification code, Facebook/Meta Pixel ID, and optional
// extra robots.txt text, consumed by apps/web (generateMetadata in
// app/layout.tsx, GA4/Pixel <Script> injection, and app/robots.ts) via the
// public GET /api/public/seo-settings below. Registered before the generic
// '/:key' route for the same shadowing reason as the settings pairs above.
// Distinct from the decorative, non-functional "Third-Party API Keys" quick
// card on /admin/settings (id="apikeys") — that card's "Save API Keys"
// button has no onClick handler and is intentionally left untouched; this is
// the real, working home for the GA4/Pixel values it only visually mocks up.
const DEFAULT_SEO_SETTINGS = {
  defaultMetaTitle: '',
  defaultMetaTitleTemplate: '',
  defaultMetaDescription: '',
  ogImageUrl: '',
  twitterHandle: '',
  defaultKeywords: '',
  googleAnalyticsId: '',
  googleSiteVerification: '',
  facebookPixelId: '',
  robotsExtra: '',
};

router.get('/seo-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'seo_settings' } });
    if (!setting?.value) { res.json(DEFAULT_SEO_SETTINGS); return; }
    try {
      res.json({ ...DEFAULT_SEO_SETTINGS, ...JSON.parse(setting.value) });
    } catch {
      res.json(DEFAULT_SEO_SETTINGS);
    }
  } catch (error) {
    console.error('Get SEO settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/seo-settings', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const value = JSON.stringify(req.body ?? {});
    const setting = await prisma.setting.upsert({
      where: { key: 'seo_settings' },
      update: { value },
      create: { key: 'seo_settings', value, type: 'general' },
    });
    res.json(setting);
  } catch (error) {
    console.error('Update SEO settings error:', error);
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
