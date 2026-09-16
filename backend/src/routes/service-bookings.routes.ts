import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { convertToJobCardService } from '../services/serviceBookings/convertToJobCard.service';
import { serviceBookingService } from '../services/serviceBookings/serviceBooking.service';

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

// GET /api/service-bookings/stats (admin aggregate stats)
router.get('/stats', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const [scheduled, inProgress, completed, pending, technicians] = await Promise.all([
      prisma.serviceBooking.count({ where: { status: { in: ['scheduled', 'SCHEDULED'] } } }),
      prisma.serviceBooking.count({ where: { status: { in: ['in_progress', 'IN_PROGRESS'] } } }),
      prisma.serviceBooking.count({ where: { status: { in: ['completed', 'COMPLETED'] } } }),
      prisma.serviceBooking.count({ where: { status: { in: ['pending', 'PENDING'] } } }),
      prisma.serviceBooking.findMany({
        where: { technician: { not: null } },
        select: { technician: true },
        distinct: ['technician'],
      }),
    ]);

    res.json({ scheduled: scheduled + pending, inProgress, completed, technicianCount: technicians.length });
  } catch (error) {
    console.error('Service booking stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/service-bookings (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, customerEmail, nationalId, vehicleInfo, serviceType, date, timeSlot, vehicleYear, mileage, vin, location, notes } = req.body;

    const result = await serviceBookingService.create({
      customerName: customerName || '',
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      nationalId,
      serviceType: serviceType || '',
      vehicleInfo: vehicleInfo || '',
      date: date || new Date().toISOString(),
      timeSlot,
      vehicleYear,
      mileage,
      vin,
      location,
      notes,
      createdById: req.adminSession!.user.id,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json(result.data);
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
// Delegates to convertToJobCardService, which builds the JobCard from the
// ServiceBooking's actual fields (customerName/Phone/Email, vehicleInfo ->
// vehicleModel, etc.) — ServiceBooking has no customerId/vehicleId, and
// JobCard has no reverse jobCardId scalar to set on the booking (the FK
// lives on JobCard.serviceBookingId; the service links it via serviceBookingId
// on create, inside a transaction with the booking's status update).
router.post('/:id/convert-to-job-card', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await convertToJobCardService.convert(req.params.id, req.adminSession!.user.id, req.body);
    if (!result.ok) {
      const status = result.error === 'Service booking not found.' ? 404 : 400;
      res.status(status).json({ error: result.error });
      return;
    }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Convert to job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as serviceBookingRoutes };
