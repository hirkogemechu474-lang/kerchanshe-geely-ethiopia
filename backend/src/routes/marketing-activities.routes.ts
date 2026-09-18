import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

// Sales Dashboard's "Daily Marketing Activities" log — any authenticated
// staff member can log/update one (matching WalkInRegistration's own gate
// in walk-in.routes.ts: this is a daily operational log, not a
// permission-gated management screen).
const router = Router();
router.use(requireAdminApiSession);

const STATUSES = ['planned', 'ongoing', 'completed'] as const;

function dayRange(dateParam: unknown): { gte: Date; lt: Date } {
  const base = typeof dateParam === 'string' && !Number.isNaN(Date.parse(dateParam)) ? new Date(dateParam) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { gte: start, lt: end };
}

// GET /api/marketing-activities?date=YYYY-MM-DD (default: today)
router.get('/', async (req: Request, res: Response) => {
  try {
    const range = dayRange(req.query.date);
    const items = await prisma.marketingActivity.findMany({
      where: { date: range },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (error) {
    console.error('List marketing activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/marketing-activities
router.post('/', async (req: Request, res: Response) => {
  try {
    const { activity, channel, leads, status, notes, date } = req.body || {};
    if (!activity || typeof activity !== 'string') {
      res.status(400).json({ error: 'activity is required' });
      return;
    }
    if (!channel || typeof channel !== 'string') {
      res.status(400).json({ error: 'channel is required' });
      return;
    }
    const normalizedStatus = STATUSES.includes(status) ? status : 'planned';

    const created = await prisma.marketingActivity.create({
      data: {
        activity,
        channel,
        leads: Number.isFinite(Number(leads)) ? Math.max(0, Math.trunc(Number(leads))) : 0,
        status: normalizedStatus,
        notes: notes || null,
        date: date && !Number.isNaN(Date.parse(date)) ? new Date(date) : new Date(),
        createdById: req.adminSession!.user.id,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Create marketing activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/marketing-activities/:id — update leads/status as the day progresses
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { leads, status, notes } = req.body || {};
    const data: { leads?: number; status?: string; notes?: string | null } = {};
    if (leads !== undefined) data.leads = Math.max(0, Math.trunc(Number(leads)) || 0);
    if (status !== undefined && STATUSES.includes(status)) data.status = status;
    if (notes !== undefined) data.notes = notes || null;

    const updated = await prisma.marketingActivity.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (error) {
    console.error('Update marketing activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/marketing-activities/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.marketingActivity.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete marketing activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as marketingActivitiesRoutes };
