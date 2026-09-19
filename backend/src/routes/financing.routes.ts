import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { slugify } from '../utils/formatting';

const router = Router();

// Was session-only — any authenticated staff member could create/edit/delete
// financing programs and partner banks. canManageSettings matches the
// '/admin/financing' nav entry (AdminLayout.tsx) and the gate already used
// by apps/admin/app/admin/financing/page.tsx.
router.use(requireAdminApiSession);
router.use(requirePermission('canManageSettings'));

// FinancingProgram's canonical Prisma fields — the admin UI form
// (apps/admin/app/admin/financing/page.tsx) uses short UI-only field names
// (downPayment, minDp, maxDp, minTM, maxTM, processingFee, procFeeMin,
// procFeeMax, insurance) alongside the canonical ones in its `toApi()`
// mapper, and never collects a `slug` at all — so create/update must
// whitelist to just these columns (dropping the UI-only extras, which
// Prisma would otherwise reject) and generate a slug server-side.
function pickProgramFields(body: any) {
  const {
    name, bankId, interestRate, downPaymentPercent, minDownPaymentPercent, maxDownPaymentPercent,
    tenureMonths, minTenureMonths, maxTenureMonths, processingFeePercent, processingFeeMin, processingFeeMax,
    insurancePercent, vehicleId, vehicleCategoryId, appliesToAllVehicles,
    applyEnabled, applyUrl, applyLabel, directPayEnabled, directPayUrl, directPayLabel,
    visitShowroomEnabled, visitShowroomUrl, visitShowroomLabel, scheduleEnabled, scheduleUrl,
    badgeText, highlightBadge, finePrint, eligibilityNote, status, displayOrder,
  } = body;
  return {
    name, bankId, interestRate, downPaymentPercent, minDownPaymentPercent, maxDownPaymentPercent,
    tenureMonths, minTenureMonths, maxTenureMonths, processingFeePercent, processingFeeMin, processingFeeMax,
    insurancePercent, vehicleId: vehicleId || null, vehicleCategoryId: vehicleCategoryId || null, appliesToAllVehicles,
    applyEnabled, applyUrl, applyLabel, directPayEnabled, directPayUrl, directPayLabel,
    visitShowroomEnabled, visitShowroomUrl, visitShowroomLabel, scheduleEnabled, scheduleUrl,
    badgeText, highlightBadge, finePrint, eligibilityNote, status, displayOrder,
  };
}

// ── Programs ─────────────────────────────────────────────────────────────

// GET /api/financing/programs (admin list)
router.get('/programs', async (req: Request, res: Response) => {
  try {
    const programs = await prisma.financingProgram.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(programs);
  } catch (error) {
    console.error('List financing programs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing/programs (admin create)
router.post('/programs', async (req: Request, res: Response) => {
  try {
    const slug = `${slugify(req.body.name || 'program')}-${Date.now().toString(36)}`;
    const program = await prisma.financingProgram.create({ data: { ...pickProgramFields(req.body), slug } });
    res.status(201).json(program);
  } catch (error) {
    console.error('Create financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/financing/programs/:id (admin detail)
router.get('/programs/:id', async (req: Request, res: Response) => {
  try {
    const program = await prisma.financingProgram.findUnique({ where: { id: req.params.id } });
    if (!program) { res.status(404).json({ error: 'Program not found' }); return; }
    res.json(program);
  } catch (error) {
    console.error('Get financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/financing/programs/:id (admin update)
router.put('/programs/:id', async (req: Request, res: Response) => {
  try {
    const program = await prisma.financingProgram.update({ where: { id: req.params.id }, data: pickProgramFields(req.body) });
    res.json(program);
  } catch (error) {
    console.error('Update financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/financing/programs/:id (admin delete)
router.delete('/programs/:id', async (req: Request, res: Response) => {
  try {
    await prisma.financingProgram.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete financing program error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Banks ────────────────────────────────────────────────────────────────

// FinancingBank's editable Prisma columns — the admin UI's GET response
// includes a computed `_count.financingPrograms`, which `openEditBank()`/
// `toggleBankActive()` then spread straight back into the PUT body (and
// `emptyBank()` seeds a literal `id: ''` sent on every create) — neither
// `_count` nor a client-supplied `id` are real writable columns, so both
// must be dropped before hitting Prisma.
function pickBankFields(body: any) {
  const { name, slug, logoUrl, websiteUrl, phoneNumber, email, branchAddress, shortDescription, isActive, displayOrder } = body;
  return { name, slug, logoUrl, websiteUrl, phoneNumber, email, branchAddress, shortDescription, isActive, displayOrder };
}

// GET /api/financing/banks (admin list)
router.get('/banks', async (req: Request, res: Response) => {
  try {
    const banks = await prisma.financingBank.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { financingPrograms: true } } }
    });
    res.json(banks);
  } catch (error) {
    console.error('List banks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing/banks (admin create)
router.post('/banks', async (req: Request, res: Response) => {
  try {
    const bank = await prisma.financingBank.create({ data: pickBankFields(req.body) });
    res.status(201).json(bank);
  } catch (error) {
    console.error('Create bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/financing/banks/:id (admin detail)
router.get('/banks/:id', async (req: Request, res: Response) => {
  try {
    const bank = await prisma.financingBank.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { financingPrograms: true } } }
    });
    if (!bank) { res.status(404).json({ error: 'Bank not found' }); return; }
    res.json(bank);
  } catch (error) {
    console.error('Get bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/financing/banks/:id (admin update)
router.put('/banks/:id', async (req: Request, res: Response) => {
  try {
    const bank = await prisma.financingBank.update({ where: { id: req.params.id }, data: pickBankFields(req.body) });
    res.json(bank);
  } catch (error) {
    console.error('Update bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/financing/banks/:id (admin delete)
router.delete('/banks/:id', async (req: Request, res: Response) => {
  try {
    await prisma.financingBank.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bank error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as financingRoutes };
