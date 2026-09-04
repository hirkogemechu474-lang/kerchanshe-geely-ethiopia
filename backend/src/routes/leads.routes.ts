import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { LeadService } from '../services/leads/lead.service';

const router = Router();

// POST /api/leads (public - submit lead from website/walk-in/phone)
router.post('/', async (req: Request, res: Response) => {
  try {
    const lead = await LeadService.create(req.body);
    if (!lead.ok) {
      return res.status(400).json({ error: lead.error });
    }
    res.status(201).json({ success: true, lead: lead.data });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({ items: leads, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
    });
    if (!lead) { res.status(404).json({ error: 'Lead not found' }); return; }
    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/qualify (qualify/reject lead)
router.post('/:id/qualify', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { qualified, internalNotes } = req.body;
    const lead = await LeadService.qualify(req.params.id, {
      qualified,
      internalNotes,
    });
    if (!lead.ok) {
      return res.status(400).json({ error: lead.error });
    }
    res.json({ success: true, lead: lead.data });
  } catch (error) {
    console.error('Qualify lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/test-drive (schedule test drive)
router.post('/:id/test-drive', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { scheduledAt, preferredTime, alternativeDate, alternativeTime, location, specialRequests } = req.body;
    const result = await LeadService.scheduleTestDrive(req.params.id, {
      leadId: req.params.id,
      scheduledAt: new Date(scheduledAt),
      preferredTime,
      alternativeDate: alternativeDate ? new Date(alternativeDate) : undefined,
      alternativeTime,
      location,
      specialRequests,
    });
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, lead: result.data });
  } catch (error) {
    console.error('Schedule test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/assign (assign lead to sales rep)
router.post('/:id/assign', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { salesRepId } = req.body;
    const result = await LeadService.assign(req.params.id, salesRepId);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, lead: result.data });
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/:id/escalate (escalate lead to manager/new rep)
router.post('/:id/escalate', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { reason, newAssignee } = req.body;
    const result = await LeadService.escalate(req.params.id, reason, newAssignee);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, lead: result.data });
  } catch (error) {
    console.error('Escalate lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leads/check-overdue (check for overdue leads)
router.post('/check-overdue', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    // Find leads in 'new' status for more than 24 hours without assignment
    const overdue = await prisma.lead.findMany({
      where: {
        status: 'new',
        assignedTo: null,
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    res.json({ overdueCount: overdue.length, leads: overdue });
  } catch (error) {
    console.error('Check overdue leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as leadRoutes };