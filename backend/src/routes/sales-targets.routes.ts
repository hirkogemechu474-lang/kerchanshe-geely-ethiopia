import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';

const router = Router();

// Sales targets are the one input the Executive Overview's "Achievement %" /
// "vs Plan" figures are computed against — same manager-tier gate as the
// dashboards that consume them (canViewExecutiveDashboards), not a general
// Settings permission, since this is leadership's own quota input rather
// than site configuration.
const guard = [requireAdminApiSession, requirePermission('canViewExecutiveDashboards')];

function isValidMonth(month: unknown): month is string {
  return typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

// GET /api/sales-targets?month=YYYY-MM — company-wide target (dealerId null)
// plus every dealer's target for that month, dealers with no row yet simply
// absent (the frontend renders those as "not set" rather than zero).
router.get('/', guard, async (req: Request, res: Response) => {
  try {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    if (!isValidMonth(month)) {
      res.status(400).json({ error: 'Invalid month — expected YYYY-MM' });
      return;
    }

    const [targets, dealers] = await Promise.all([
      prisma.salesTarget.findMany({ where: { month } }),
      prisma.dealer.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    ]);

    const companyTarget = targets.find((t) => t.dealerId === null) || null;
    const byDealer = new Map(targets.filter((t) => t.dealerId !== null).map((t) => [t.dealerId as string, t]));

    res.json({
      month,
      company: companyTarget ? { revenueTarget: companyTarget.revenueTarget, unitsTarget: companyTarget.unitsTarget } : null,
      dealers: dealers.map((d) => {
        const t = byDealer.get(d.id);
        return {
          dealerId: d.id,
          name: d.name,
          revenueTarget: t?.revenueTarget ?? null,
          unitsTarget: t?.unitsTarget ?? null,
        };
      }),
    });
  } catch (error) {
    console.error('Get sales targets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/sales-targets — upsert one target row (company-wide when
// dealerId is omitted/null, otherwise that showroom's own target).
router.put('/', guard, async (req: Request, res: Response) => {
  try {
    const { month, dealerId, revenueTarget, unitsTarget } = req.body || {};
    if (!isValidMonth(month)) {
      res.status(400).json({ error: 'Invalid month — expected YYYY-MM' });
      return;
    }
    const revenue = Number(revenueTarget);
    const units = Number(unitsTarget);
    if (!Number.isFinite(revenue) || revenue < 0 || !Number.isInteger(units) || units < 0) {
      res.status(400).json({ error: 'revenueTarget and unitsTarget must be non-negative numbers' });
      return;
    }
    const normalizedDealerId: string | null = dealerId || null;
    if (normalizedDealerId) {
      const dealer = await prisma.dealer.findUnique({ where: { id: normalizedDealerId }, select: { id: true } });
      if (!dealer) {
        res.status(400).json({ error: 'Unknown dealer' });
        return;
      }
    }

    // @@unique([month, dealerId]) can't be targeted by Prisma's compound
    // upsert `where` when dealerId is null (Prisma compound-unique lookups
    // don't accept null members), so branch on find-then-create/update
    // instead of a single upsert call.
    const existing = await prisma.salesTarget.findFirst({ where: { month, dealerId: normalizedDealerId } });
    const data = { month, dealerId: normalizedDealerId, revenueTarget: revenue, unitsTarget: units, createdById: req.adminSession!.user.id };
    const target = existing
      ? await prisma.salesTarget.update({ where: { id: existing.id }, data: { revenueTarget: revenue, unitsTarget: units } })
      : await prisma.salesTarget.create({ data });

    res.json(target);
  } catch (error) {
    console.error('Upsert sales target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as salesTargetsRoutes };
