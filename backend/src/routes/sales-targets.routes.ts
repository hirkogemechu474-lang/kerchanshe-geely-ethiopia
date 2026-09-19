import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { userRepository } from '../repositories';
import { env } from '../config/env';

const router = Router();

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Mirrors the Day/Week/Month/Year breakdown shown on the Sales Targets admin
// page (apps/admin/.../SalesTargetsSettings.tsx) so the notification a team
// gets matches what they'd see if they opened the settings page themselves.
function periodBreakdown(monthlyValue: number, month: string) {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const perDay = monthlyValue / days;
  return { day: perDay, week: perDay * 7, month: monthlyValue, year: monthlyValue * 12 };
}

// Fire-and-forget: notifies the assigned sales team (or, for a company-wide
// target, every manager) that a target was set for them — email + in-app
// bell, via the shared dispatch used across the app. Never blocks or fails
// the save itself.
async function notifyTargetAssigned(params: {
  month: string;
  dealerId: string | null;
  dealerName: string | null;
  revenueTarget: number;
  unitsTarget: number;
}) {
  try {
    const { month, dealerId, dealerName, revenueTarget, unitsTarget } = params;

    let emails: string[] = [];
    if (dealerId) {
      const team = await userRepository.findActiveByDealerAndRoles(dealerId, ['sales', 'sales_representative', 'sales_manager', 'manager']);
      emails = team.map((u) => u.email).filter((e): e is string => Boolean(e));
    }
    if (emails.length === 0) {
      emails = await userRepository.findManagerEmails();
    }
    if (emails.length === 0) return;

    const teamLabel = dealerName ? `${dealerName} sales team` : 'Company-wide (all sales teams)';
    const monthText = monthLabel(month);
    const revenue = periodBreakdown(revenueTarget, month);
    const units = periodBreakdown(unitsTarget, month);
    const fmtEtb = (n: number) => `ETB ${Math.round(n).toLocaleString('en-US')}`;
    const fmtUnits = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 });

    await dispatchNotification({
      type: 'sales_target_assigned',
      to: emails,
      subject: `New sales target for ${monthText} — ${teamLabel}`,
      data: {
        team: teamLabel,
        month: monthText,
        revenuePerDay: fmtEtb(revenue.day),
        revenuePerWeek: fmtEtb(revenue.week),
        revenuePerMonth: fmtEtb(revenue.month),
        revenuePerYear: fmtEtb(revenue.year),
        unitsPerDay: fmtUnits(units.day),
        unitsPerWeek: fmtUnits(units.week),
        unitsPerMonth: fmtUnits(units.month),
        unitsPerYear: fmtUnits(units.year),
        adminLink: `${env.urls.admin}/admin/sales-targets`,
      },
      inApp: {
        type: 'sales_target_assigned',
        title: `New target assigned — ${teamLabel}`,
        body: `${teamLabel}'s ${monthText} target is ${fmtEtb(revenue.month)} revenue / ${fmtUnits(units.month)} units — that's ${fmtEtb(revenue.day)}/day, ${fmtEtb(revenue.week)}/week, ${fmtEtb(revenue.year)}/year.`,
        link: '/admin/sales-targets',
        relatedModel: 'SalesTarget',
        relatedId: dealerId || 'company',
        priority: 'normal',
      },
    });
  } catch (error: any) {
    console.error('[SALES TARGET NOTIFICATION ERROR]', error.message);
  }
}

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
    let dealerName: string | null = null;
    if (normalizedDealerId) {
      const dealer = await prisma.dealer.findUnique({ where: { id: normalizedDealerId }, select: { id: true, name: true } });
      if (!dealer) {
        res.status(400).json({ error: 'Unknown dealer' });
        return;
      }
      dealerName = dealer.name;
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

    void notifyTargetAssigned({ month, dealerId: normalizedDealerId, dealerName, revenueTarget: revenue, unitsTarget: units });
  } catch (error) {
    console.error('Upsert sales target error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as salesTargetsRoutes };
