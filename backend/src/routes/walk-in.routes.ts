import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { quotationService } from '../services/sales/quotation.service';
import { quotationRepository, userRepository } from '../repositories';

const router = Router();

// Every route here only ever required a valid admin session — any
// authenticated staff member of any role could read/create/delete walk-in
// registrations. canManageTestDrives matches AdminLayout.tsx's "Walk-in
// Registrations" nav item and both apps/admin/app/admin/walk-ins page.tsx
// files' own requirePermission('canManageTestDrives') guard (there's no
// separate view-only mode for this module).
const gate = requirePermission('canManageTestDrives');

// A walk-in becomes a sales lead: an open quotation for the same phone number
// is reused (so a returning visitor never gets duplicated), otherwise a new
// one is opened and auto-assigned to the least-loaded sales agent, which also
// emails/notifies that agent and the managers (quotationService.create).
async function openLeadForWalkIn(walkIn: {
  id: string; customerName: string; phone: string; email: string | null; vehicleInterest: string | null; notes: string | null;
}): Promise<{ quotationId: string; reference: string | null; existing: boolean; assignedToName: string | null } | null> {
  const existing = await quotationRepository.findOpenByPhone(walkIn.phone);
  let quotation: any = existing;
  let assignedToId: string | null | undefined = existing?.assignedTo;
  if (!quotation) {
    const created = await quotationService.create({
      customerName: walkIn.customerName,
      phoneNumber: walkIn.phone,
      email: walkIn.email || undefined,
      vehicleModel: walkIn.vehicleInterest || undefined,
      message: walkIn.notes || undefined,
      source: 'walk-in',
      autoAssign: true,
    });
    if (!created.ok || !created.data) return null;
    quotation = created.data;
    assignedToId = created.assignedRep?.userId ?? quotation.assignedTo;
  }
  await prisma.walkInRegistration.update({ where: { id: walkIn.id }, data: { quotationId: quotation.id } });
  const assignee = assignedToId ? await userRepository.findById(assignedToId) : null;
  return { quotationId: quotation.id, reference: quotation.reference ?? null, existing: Boolean(existing), assignedToName: assignee?.name ?? null };
}

// GET /api/walk-ins — list walk-in registrations (admin)
router.get('/', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.walkInRegistration.findMany({
        where,
        include: { registeredBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.walkInRegistration.count({ where }),
    ]);

    // Attach each walk-in's lead reference/assignee so the front desk can see
    // the hand-over happened (and to whom) without needing quotation access.
    const leadIds = items.map((i) => i.quotationId).filter((id): id is string => Boolean(id));
    const leads = leadIds.length
      ? await prisma.quotation.findMany({ where: { id: { in: leadIds } }, select: { id: true, reference: true, assignedTo: true } })
      : [];
    const assigneeIds = [...new Set(leads.map((l) => l.assignedTo).filter((id): id is string => Boolean(id)))];
    const assignees = assigneeIds.length
      ? await prisma.user.findMany({ where: { id: { in: assigneeIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(assignees.map((u) => [u.id, u.name]));
    const leadById = new Map(leads.map((l) => [l.id, { reference: l.reference, assignedToName: l.assignedTo ? nameById.get(l.assignedTo) ?? null : null }]));
    const withLead = items.map((i) => ({ ...i, lead: i.quotationId ? leadById.get(i.quotationId) ?? null : null }));

    res.json({ items: withLead, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List walk-ins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/walk-ins — create walk-in registration (admin)
router.post('/', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { customerName, phone, email, vehicleInterest, notes } = req.body;

    if (!customerName || !phone) {
      res.status(400).json({ error: 'Customer name and phone are required.' });
      return;
    }

    const walkIn = await prisma.walkInRegistration.create({
      data: {
        customerName,
        phone,
        email: email || null,
        vehicleInterest: vehicleInterest || null,
        notes: notes || null,
        registeredById: req.adminSession!.user.id,
      },
      include: { registeredBy: { select: { id: true, name: true, email: true } } },
    });

    // Opening the sales lead must never lose the registration itself.
    let lead = null;
    try {
      lead = await openLeadForWalkIn(walkIn);
    } catch (leadError) {
      console.error('Walk-in lead creation error:', leadError);
    }

    res.status(201).json({ ...walkIn, lead });
  } catch (error) {
    console.error('Create walk-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/walk-ins/:id/lead: open the sales lead for a walk-in that has
// none yet (registered before this existed, or the automatic step failed).
router.post('/:id/lead', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const walkIn = await prisma.walkInRegistration.findUnique({ where: { id: req.params.id } });
    if (!walkIn) { res.status(404).json({ error: 'Walk-in registration not found.' }); return; }
    const lead = await openLeadForWalkIn(walkIn);
    if (!lead) { res.status(400).json({ error: 'Could not open a sales lead for this walk-in.' }); return; }
    res.json({ lead });
  } catch (error) {
    console.error('Walk-in lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/walk-ins/:id — delete walk-in registration (admin)
router.delete('/:id', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const walkIn = await prisma.walkInRegistration.findUnique({ where: { id: req.params.id } });
    if (!walkIn) {
      res.status(404).json({ error: 'Walk-in registration not found.' });
      return;
    }

    await prisma.walkInRegistration.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete walk-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as walkInRoutes };
