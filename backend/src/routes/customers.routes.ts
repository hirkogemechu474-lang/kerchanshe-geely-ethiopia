import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { customerService } from '../services/customers/customer.service';

const router = Router();

// POST /api/customers (admin create — e.g. a walk-in customer with no
// account, registered at the counter). Dedupes by phone (see
// Customer.phone's schema comment) instead of enforcing a DB constraint.
router.post('/', requireAdminApiSession, requirePermission('canManageCustomers'), async (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, address } = req.body;
    if (!fullName || !phone) {
      res.status(400).json({ error: 'Full name and phone are required.' });
      return;
    }

    const result = await customerService.create({ fullName, phone, email, address });
    if (!result.ok) {
      res.status(409).json({ error: result.error });
      return;
    }

    res.status(201).json({ customer: result.data });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers (admin search/list)
router.get('/', requireAdminApiSession, requirePermission('canViewCustomers'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: { id: true, fullName: true, email: true, phone: true, createdAt: true, vehicles: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customers/:id (admin detail)
router.get('/:id', requireAdminApiSession, requirePermission('canViewCustomers'), async (req: Request, res: Response) => {
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

// GET /api/customers/:id/history (unified sales/warranty/complaint history)
// Every domain model (Quotation/SalesOrder/WarrantyClaim/ComplaintCase/
// Warranty) stores customerPhone as a free string with no customerId FK —
// retrofitting that FK onto five-plus models would be a much bigger, riskier
// schema change than this feature needs, so this aggregates the same way
// the rest of the codebase already dedupes/looks customers up: by phone
// number (and, where available, by VIN for the vehicles on file).
router.get('/:id/history', requireAdminApiSession, requirePermission('canViewCustomers'), async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { vehicles: { select: { vin: true } } },
    });
    if (!customer) { res.status(404).json({ error: 'Customer not found' }); return; }

    const vins = customer.vehicles.map((v) => v.vin).filter((v): v is string => Boolean(v));

    const [quotations, salesOrders, warrantyClaims, complaints, warranties, loyaltyAccount, leads, jobCards] = await Promise.all([
      prisma.quotation.findMany({
        where: { phoneNumber: customer.phone },
        select: { id: true, quotationNo: true, vehicleModel: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salesOrder.findMany({
        where: { OR: [{ customerPhone: customer.phone }, ...(vins.length ? [{ vehicleAllocation: { vin: { in: vins } } }] : [])] },
        select: { id: true, orderNo: true, vehicleModel: true, status: true, totalPrice: true, orderDate: true },
        orderBy: { orderDate: 'desc' },
      }),
      prisma.warrantyClaim.findMany({
        where: { jobCard: { customerPhone: customer.phone } },
        select: { id: true, claimNo: true, status: true, defectCode: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaintCase.findMany({
        where: { OR: [{ customerPhone: customer.phone }, ...(vins.length ? [{ vin: { in: vins } }] : [])] },
        select: { id: true, caseNo: true, subject: true, status: true, priority: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warranty.findMany({
        where: { OR: [{ customerPhone: customer.phone }, ...(vins.length ? [{ vin: { in: vins } }] : [])] },
        select: { id: true, vehicleModel: true, status: true, warrantyStartDate: true, warrantyEndDate: true, orderId: true },
        orderBy: { warrantyStartDate: 'desc' },
      }),
      prisma.loyaltyAccount.findUnique({
        where: { customerId: customer.id },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
      }),
      prisma.lead.findMany({
        where: { customerPhone: customer.phone },
        select: { id: true, reference: true, vehicleModel: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.jobCard.findMany({
        where: { OR: [{ customerPhone: customer.phone }, ...(vins.length ? [{ vin: { in: vins } }] : [])] },
        select: { id: true, jobCardNo: true, vehicleModel: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ quotations, salesOrders, warrantyClaims, complaints, warranties, loyaltyAccount, leads, jobCards });
  } catch (error) {
    console.error('Get customer history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/customers/:id (admin update)
router.patch('/:id', requireAdminApiSession, requirePermission('canManageCustomers'), async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, address } = req.body;
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: { fullName, email, phone, address },
    });
    res.json({ id: customer.id, fullName: customer.fullName, email: customer.email, phone: customer.phone });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/customers/:id/vehicles (admin add a vehicle to a customer's file)
router.post('/:id/vehicles', requireAdminApiSession, requirePermission('canManageCustomers'), async (req: Request, res: Response) => {
  try {
    const { vin, plateNo, model, color, warrantyEndDate } = req.body;
    if (!plateNo) {
      res.status(400).json({ error: 'Plate number is required.' });
      return;
    }

    const result = await customerService.addVehicle(req.params.id, {
      vin: vin || undefined,
      plateNo,
      model: model || '',
      color: color || undefined,
      warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : undefined,
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ vehicle: result.data });
  } catch (error) {
    console.error('Add customer vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/customers/customer-vehicles/:id (update vehicle)
router.patch('/customer-vehicles/:id', requireAdminApiSession, requirePermission('canManageCustomers'), async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.customerVehicle.update({ where: { id: req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (error) {
    console.error('Update customer vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as customerRoutes };
