import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';

const router = Router();

// Every route here only ever required a valid admin session — any
// authenticated staff member of any role could read/create/delete walk-in
// registrations. canManageTestDrives matches AdminLayout.tsx's "Walk-in
// Registrations" nav item and both apps/admin/app/admin/walk-ins page.tsx
// files' own requirePermission('canManageTestDrives') guard (there's no
// separate view-only mode for this module).
const gate = requirePermission('canManageTestDrives');

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

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
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

    res.status(201).json(walkIn);
  } catch (error) {
    console.error('Create walk-in error:', error);
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
