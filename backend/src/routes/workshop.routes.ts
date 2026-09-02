import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// All workshop routes require admin session
router.use(requireAdminApiSession);

// GET /api/admin/workshop/dashboard (KPI summary)
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [totalJobCards, activeJobCards, completedJobCards, pendingParts] = await Promise.all([
      prisma.jobCard.count(),
      prisma.jobCard.count({ where: { status: { in: ['pending', 'in_progress', 'waiting_parts'] } } }),
      prisma.jobCard.count({ where: { status: 'completed' } }),
      prisma.jobCardPart.count({ where: { status: 'backordered' } }),
    ]);

    const revenue = await prisma.jobCard.aggregate({ _sum: { totalAmount: true }, where: { status: 'completed' } });

    res.json({ totalJobCards, activeJobCards, completedJobCards, pendingParts, totalRevenue: revenue._sum.totalAmount || 0 });
  } catch (error) {
    console.error('Workshop dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/board (bay scheduling board)
router.get('/board', async (req: Request, res: Response) => {
  try {
    const bays = await prisma.workshopBay.findMany({ where: { isActive: true }, include: { jobCards: { where: { status: { in: ['pending', 'in_progress', 'waiting_parts'] } }, include: { technician: true, vehicle: true } } } });
    res.json(bays);
  } catch (error) {
    console.error('Workshop board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/job-cards (list)
router.get('/job-cards', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { jobCardNo: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.jobCard.findMany({
        where,
        include: { technician: { select: { name: true } }, bay: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.jobCard.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List job cards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/job-cards (create)
router.post('/job-cards', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.create({ data: { ...req.body, createdById: req.adminSession!.user.id } });
    res.status(201).json(jobCard);
  } catch (error) {
    console.error('Create job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/job-cards/:id (detail)
router.get('/job-cards/:id', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: req.params.id },
      include: {
        technician: true,
        bay: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        jobCardParts: { include: { sparePart: true }, orderBy: { requestedAt: 'asc' } },
        warrantyClaims: { orderBy: { createdAt: 'desc' } },
        customerVehicle: {
          include: {
            customer: { select: { fullName: true, phone: true } },
            jobCards: { select: { id: true }, orderBy: { openTs: 'desc' } },
          },
        },
      },
    });
    if (!jobCard) { res.status(404).json({ error: 'Job card not found' }); return; }
    res.json({ jobCard });
  } catch (error) {
    console.error('Get job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id (update fields)
router.patch('/job-cards/:id', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.update({ where: { id: req.params.id }, data: req.body });
    res.json(jobCard);
  } catch (error) {
    console.error('Update job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id/status (transition status)
router.patch('/job-cards/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const jobCard = await prisma.jobCard.update({ where: { id: req.params.id }, data: { status } });
    res.json(jobCard);
  } catch (error) {
    console.error('Update job card status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id/assign (assign tech/bay/schedule)
router.patch('/job-cards/:id/assign', async (req: Request, res: Response) => {
  try {
    const { technicianId, bayId, scheduledAt } = req.body;
    const jobCard = await prisma.jobCard.update({
      where: { id: req.params.id },
      data: { technicianId, bayId, scheduledAt },
    });
    res.json(jobCard);
  } catch (error) {
    console.error('Assign job card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/job-cards/:id/parts (request part)
router.post('/job-cards/:id/parts', async (req: Request, res: Response) => {
  try {
    const part = await prisma.jobCardPart.create({ data: { jobCardId: req.params.id, ...req.body } });
    res.status(201).json(part);
  } catch (error) {
    console.error('Request part error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/job-cards/:id/parts/:lineId (issue/backorder/cancel part)
router.patch('/job-cards/:id/parts/:lineId', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const part = await prisma.jobCardPart.update({ where: { id: req.params.lineId }, data: { status } });
    res.json(part);
  } catch (error) {
    console.error('Update part status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/bays (list)
router.get('/bays', async (req: Request, res: Response) => {
  try {
    const bays = await prisma.serviceBay.findMany({ orderBy: { name: 'asc' } });
    res.json(bays);
  } catch (error) {
    console.error('List bays error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/bays (create)
router.post('/bays', async (req: Request, res: Response) => {
  try {
    const bay = await prisma.serviceBay.create({ data: req.body });
    res.status(201).json({ bay });
  } catch (error) {
    console.error('Create bay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/bays/:id (update)
router.patch('/bays/:id', async (req: Request, res: Response) => {
  try {
    const bay = await prisma.serviceBay.update({ where: { id: req.params.id }, data: req.body });
    res.json({ bay });
  } catch (error) {
    console.error('Update bay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/workshop/bays/:id (deactivate)
router.delete('/bays/:id', async (req: Request, res: Response) => {
  try {
    await prisma.serviceBay.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bay error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/technicians (list)
router.get('/technicians', async (req: Request, res: Response) => {
  try {
    const technicians = await prisma.technician.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { jobCards: true } } },
    });
    res.json(technicians);
  } catch (error) {
    console.error('List technicians error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/technicians (create)
router.post('/technicians', async (req: Request, res: Response) => {
  try {
    const technician = await prisma.technician.create({ data: req.body });
    res.status(201).json({ technician });
  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/technicians/:id (update)
router.patch('/technicians/:id', async (req: Request, res: Response) => {
  try {
    const technician = await prisma.technician.update({ where: { id: req.params.id }, data: req.body });
    res.json({ technician });
  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/workshop/technicians/:id (deactivate)
router.delete('/technicians/:id', async (req: Request, res: Response) => {
  try {
    await prisma.technician.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete technician error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/warranty-claims (list)
router.get('/warranty-claims', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const [items, total] = await Promise.all([
      prisma.warrantyClaim.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { jobCard: { select: { jobCardNo: true, plateNo: true, customerName: true } } },
      }),
      prisma.warrantyClaim.count(),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List warranty claims error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/workshop/warranty-claims (create)
router.post('/warranty-claims', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.warrantyClaim.create({ data: req.body });
    res.status(201).json(claim);
  } catch (error) {
    console.error('Create warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/warranty-claims/:id (detail)
router.get('/warranty-claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.warrantyClaim.findUnique({
      where: { id: req.params.id },
      include: { jobCard: true, statusHistory: { orderBy: { changedAt: 'asc' } } },
    });
    if (!claim) { res.status(404).json({ error: 'Warranty claim not found' }); return; }
    res.json({ claim });
  } catch (error) {
    console.error('Get warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/warranty-claims/:id (update)
router.patch('/warranty-claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.warrantyClaim.update({ where: { id: req.params.id }, data: req.body });
    res.json(claim);
  } catch (error) {
    console.error('Update warranty claim error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/workshop/warranty-claims/:id/status (transition status)
router.patch('/warranty-claims/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const claim = await prisma.warrantyClaim.update({ where: { id: req.params.id }, data: { status } });
    res.json(claim);
  } catch (error) {
    console.error('Update warranty claim status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/vehicle-lookup (lookup by VIN/plate)
router.get('/vehicle-lookup', async (req: Request, res: Response) => {
  try {
    const { vin, plate } = req.query;
    const where: any = {};
    if (vin) where.vin = vin;
    if (plate) where.licensePlate = plate;

    const vehicle = await prisma.vehicleInventory.findFirst({ where });
    if (!vehicle) { res.status(404).json({ error: 'Vehicle not found' }); return; }
    res.json(vehicle);
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/parts/reorder-alerts (low stock alerts)
router.get('/parts/reorder-alerts', async (req: Request, res: Response) => {
  try {
    const parts = await prisma.sparePart.findMany({ where: { stockQuantity: { lte: prisma.sparePart.fields.reorderLevel } } });
    res.json(parts);
  } catch (error) {
    console.error('Parts reorder alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/bi-dashboard (BI dashboard)
router.get('/bi-dashboard', async (req: Request, res: Response) => {
  try {
    const totalRevenue = await prisma.jobCard.aggregate({ _sum: { totalAmount: true }, where: { status: 'completed' } });
    const totalJobCards = await prisma.jobCard.count();
    const avgCompletionTime = await prisma.jobCard.aggregate({ _avg: { estimatedHours: true }, where: { status: 'completed' } });

    res.json({ totalRevenue: totalRevenue._sum.totalAmount || 0, totalJobCards, avgCompletionTime: avgCompletionTime._avg.estimatedHours || 0 });
  } catch (error) {
    console.error('BI dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/workshop/bi-dashboard/trend (multi-month trend)
router.get('/bi-dashboard/trend', async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const jobCards = await prisma.jobCard.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, totalAmount: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(jobCards);
  } catch (error) {
    console.error('BI trend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as workshopRoutes };
