import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/customers (admin search/list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where: { ...where, role: 'customer' },
        select: { id: true, name: true, email: true, phone: true, createdAt: true, customerVehicles: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where: { ...where, role: 'customer' } }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        vehicles: {
          orderBy: { updatedAt: 'desc' },
          include: {
            jobCards: {
              orderBy: { openTs: 'desc' },
              take: 10,
              select: { id: true, jobCardNo: true, status: true, complaintText: true, openTs: true, closeTs: true },
            },
          },
        },
      },
    });
    if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/customers/:id (admin update)
router.patch('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    const customer = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, phone },
    });
    res.json({ id: customer.id, name: customer.name, email: customer.email, phone: customer.phone });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/customers/customer-vehicles/:id (update vehicle)
router.patch('/customer-vehicles/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.customerVehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (error) {
    console.error('Update customer vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as customerRoutes };
