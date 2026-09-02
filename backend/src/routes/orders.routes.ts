import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// GET /api/orders (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: { customer: true, vehicle: true, quotation: true, allocation: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salesOrder.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders (admin create)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.create({ data: req.body });
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        pdiItems: { orderBy: { createdAt: 'asc' } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
        quotation: { select: { id: true } },
        testDrives: { orderBy: { createdAt: 'desc' } },
        vehicleAllocation: { include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } } },
      },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id (admin update fields)
router.patch('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: req.body });
    res.json(order);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/status (transition status)
router.patch('/:id/status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status } });
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/approve (sales agent approval)
router.post('/:id/approve', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'approved', approvedById: req.adminSession!.user.id } });
    res.json(order);
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/orders/:id/allocation (allocate vehicle)
router.put('/:id/allocation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.body;
    const allocation = await prisma.vehicleAllocation.create({ data: { orderId: req.params.id, vehicleId, allocatedById: req.adminSession!.user.id } });
    await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'vehicle_allocated', allocationId: allocation.id } });
    res.json(allocation);
  } catch (error) {
    console.error('Allocate vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/orders/:id/allocation (release allocation)
router.delete('/:id/allocation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.vehicleAllocation.deleteMany({ where: { orderId: req.params.id } });
    await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'approved', allocationId: null } });
    res.json({ success: true });
  } catch (error) {
    console.error('Release allocation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/agreement (get agreement PDF)
router.get('/:id/agreement', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id }, include: { customer: true, vehicle: true, allocation: true } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    // TODO: Generate agreement PDF
    res.json({ order });
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/countersign (manager countersign)
router.post('/:id/countersign', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'countersigned', countersignedById: req.adminSession!.user.id, countersignedAt: new Date() } });
    res.json(order);
  } catch (error) {
    console.error('Countersign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-agreement (email agreement)
router.post('/:id/send-agreement', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'agreement_sent', agreementSentAt: new Date() } });
    // TODO: Send email with agreement
    res.json(order);
  } catch (error) {
    console.error('Send agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/reject-agreement (return for correction)
router.post('/:id/reject-agreement', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'agreement_rejected', rejectionReason: reason } });
    res.json(order);
  } catch (error) {
    console.error('Reject agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/pdi (toggle PDI item)
router.patch('/:id/pdi', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { item, checked } = req.body;
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    const pdiItems = (order.pdiChecklist as any) || {};
    pdiItems[item] = checked;
    const updated = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { pdiChecklist: pdiItems } });
    res.json(updated);
  } catch (error) {
    console.error('Toggle PDI error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:id/invoice (get invoice)
router.get('/:id/invoice', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { orderId: req.params.id } });
    if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/invoice (generate invoice)
router.post('/:id/invoice', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.invoice.findFirst({ where: { orderId: req.params.id } });
    if (existing) { res.status(400).json({ error: 'Invoice already exists' }); return; }
    const invoice = await prisma.invoice.create({ data: { orderId: req.params.id, ...req.body } });
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/payment/confirm (confirm payment)
router.post('/:id/payment/confirm', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { amount, method, reference } = req.body;
    const payment = await prisma.payment.create({ data: { orderId: req.params.id, amount, method, reference, confirmedById: req.adminSession!.user.id, status: 'confirmed' } });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/orders/:id/financing-status (transition financing)
router.patch('/:id/financing-status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { financingStatus } = req.body;
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { financingStatus } });
    res.json(order);
  } catch (error) {
    console.error('Update financing status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-test-drive (invite to test drive)
router.post('/:id/send-test-drive', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { scheduledAt } = req.body;
    const testDrive = await prisma.testDrive.create({ data: { orderId: req.params.id, scheduledAt, invitedById: req.adminSession!.user.id } });
    // TODO: Send email invitation
    res.status(201).json(testDrive);
  } catch (error) {
    console.error('Send test drive error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/handover-email (send handover email)
router.post('/:id/handover-email', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { handoverEmailSentAt: new Date() } });
    // TODO: Send handover email
    res.json(order);
  } catch (error) {
    console.error('Send handover email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/handover-countersign (manager countersign handover)
router.post('/:id/handover-countersign', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { status: 'handover_countersigned', handoverCountersignedById: req.adminSession!.user.id, handoverCountersignedAt: new Date() } });
    res.json(order);
  } catch (error) {
    console.error('Handover countersign error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/send-handover-signoff (email handover signoff)
router.post('/:id/send-handover-signoff', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { handoverSignoffSentAt: new Date() } });
    // TODO: Send handover signoff email
    res.json(order);
  } catch (error) {
    console.error('Send handover signoff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders/:id/commission/pay (mark commission paid)
router.post('/:id/commission/pay', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: { commissionPaid: true, commissionPaidAt: new Date() } });
    res.json(order);
  } catch (error) {
    console.error('Mark commission paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as orderRoutes };
