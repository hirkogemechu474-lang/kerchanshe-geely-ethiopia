import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/quotations (admin list)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: { vehicle: true, salesAgent: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.quotation.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List quotations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations (admin create walk-in lead)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.create({
      data: { ...req.body, createdById: req.adminSession!.user.id },
    });
    res.status(201).json(quotation);
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id (admin detail)
router.get('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
    });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    res.json(quotation);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id/prior-inquiries (other quotations sharing this
// quotation's phone number — UC-01 dedupe visibility)
router.get('/:id/prior-inquiries', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }

    const priorInquiries = await prisma.quotation.findMany({
      where: { phoneNumber: quotation.phoneNumber, id: { not: quotation.id } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, vehicleModel: true, status: true, createdAt: true },
    });

    res.json(priorInquiries);
  } catch (error) {
    console.error('Get prior inquiries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/quotations/:id (admin update)
router.put('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.update({ where: { id: req.params.id }, data: req.body });
    res.json(quotation);
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quotations/:id (admin delete)
router.delete('/:id', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    await prisma.quotation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/send-quotation (email to customer)
router.post('/:id/send-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'sent', sentAt: new Date() },
    });
    // TODO: Send email with quotation
    res.json(quotation);
  } catch (error) {
    console.error('Send quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/reject-quotation (manager reject)
router.post('/:id/reject-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'rejected', rejectedReason: reason, rejectedById: req.adminSession!.user.id },
    });
    res.json(quotation);
  } catch (error) {
    console.error('Reject quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotations/:id/quotation-pdf (view PDF)
router.get('/:id/quotation-pdf', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id }, include: { vehicle: true, salesAgent: true } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    // TODO: Generate PDF
    res.json({ quotation });
  } catch (error) {
    console.error('Get quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/quotation-pdf (generate PDF)
router.post('/:id/quotation-pdf', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id }, include: { vehicle: true, salesAgent: true } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }
    // TODO: Generate PDF and store URL
    res.json({ quotation, pdfUrl: null });
  } catch (error) {
    console.error('Generate quotation PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/escalate (escalate to manager)
router.post('/:id/escalate', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'escalated', escalatedAt: new Date() },
    });
    res.json(quotation);
  } catch (error) {
    console.error('Escalate quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/convert-to-order (convert to sales order)
router.post('/:id/convert-to-order', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) { res.status(404).json({ error: 'Quotation not found' }); return; }

    const order = await prisma.salesOrder.create({
      data: { quotationId: quotation.id, customerId: quotation.customerId, vehicleId: quotation.vehicleId, totalAmount: quotation.totalAmount, createdById: req.adminSession!.user.id },
    });

    await prisma.quotation.update({ where: { id: req.params.id }, data: { status: 'converted', orderId: order.id } });

    res.status(201).json(order);
  } catch (error) {
    console.error('Convert quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations/:id/approve-quotation (manager approve)
router.post('/:id/approve-quotation', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'approved', approvedById: req.adminSession!.user.id, approvedAt: new Date() },
    });
    res.json(quotation);
  } catch (error) {
    console.error('Approve quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quotations (public - submit lead quotation)
router.post('/submit', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const quotation = await prisma.quotation.create({ data: req.body });
    res.status(201).json({ success: true, reference: quotation.reference });
  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as quotationRoutes };
