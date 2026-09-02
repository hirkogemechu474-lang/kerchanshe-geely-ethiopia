import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// POST /api/payments/initiate (initiate payment)
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { orderId, amount, method } = req.body;
    const payment = await prisma.payment.create({
      data: { orderId, amount, method, status: 'pending' },
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payments/:paymentId (get payment)
router.get('/:paymentId', async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.paymentId }, include: { order: true } });
    if (!payment) { res.status(404).json({ error: 'Payment not found' }); return; }
    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/payments/:paymentId/authorize (authorize payment)
router.post('/:paymentId/authorize', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.paymentId },
      data: { status: 'authorized', authorizedById: req.adminSession!.user.id, authorizedAt: new Date() },
    });
    res.json(payment);
  } catch (error) {
    console.error('Authorize payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as paymentRoutes };
