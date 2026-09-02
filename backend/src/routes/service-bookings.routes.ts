import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/service-bookings (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.serviceBooking.findMany({
        where,
        include: { jobCard: { select: { id: true, jobCardNo: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.serviceBooking.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List service bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/service-bookings/stats (admin aggregate stats — global counts the
// paginated list above can't provide on its own)
router.get('/stats', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const [scheduled, inProgress, completed, technicians] = await Promise.all([
      prisma.serviceBooking.count({ where: { status: 'scheduled' } }),
      prisma.serviceBooking.count({ where: { status: 'in_progress' } }),
      prisma.serviceBooking.count({ where: { status: 'completed' } }),
      prisma.serviceBooking.findMany({
        where: { technician: { not: null } },
        select: { technician: true },
        distinct: ['technician'],
      }),
    ]);

    res.json({ scheduled, inProgress, completed, technicianCount: technicians.length });
  } catch (error) {
    console.error('Service booking stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/service-bookings (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.serviceBooking.create({
      data: { ...req.body, createdById: req.adminSession!.user.id },
    });
    res.status(201).json(booking);
  } catch (error) {
    console.error('Create service booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/service-bookings/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: req.params.id },
      include: { jobCard: true },
    });
    if (!booking) { res.status(404).json({ error: 'Service booking not found' }); return; }
    res.json(booking);
  } catch (error) {
    console.error('Get service booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/service-bookings/:id/convert-to-job-card (convert to job card)
router.post('/:id/convert-to-job-card', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const booking = await prisma.serviceBooking.findUnique({ where: { id: req.params.id } });
    if (!booking) { res.status(404).json({ error: 'Service booking not found' }); return; }

    const jobCard = await prisma.jobCard.create({
      data: {
        customerId: booking.customerId,
        vehicleId: booking.vehicleId,
        serviceBookingId: booking.id,
        description: booking.notes || '',
        createdById: req.adminSession!.user.id,
      },
    });

    await prisma.serviceBooking.update({ where: { id: req.params.id }, data: { status: 'converted', jobCardId: jobCard.id } });

    res.status(201).json(jobCard);
  } catch (error) {
    console.error('Convert to job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as serviceBookingRoutes };
