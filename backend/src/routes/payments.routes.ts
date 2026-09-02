import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// NOTE: these routes used a `Payment` model that doesn't exist anywhere in
// schema.prisma. There's no separate payment ledger table — a payment is
// tracked directly on its `SalesOrder` (paymentStatus/paymentProofUrl/
// paymentSubmittedAt/paymentConfirmedAt/paymentConfirmedById, per that
// model's own doc comment) — same convention already used in
// public.routes.ts and legacyPayment.service.ts. There's no `amount`/
// `method`/`transactionId` column to persist those request fields against.

// POST /api/payments/initiate (initiate payment)
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const payment = await prisma.salesOrder.update({
      where: { id: orderId },
      data: { paymentStatus: 'PENDING_REVIEW', paymentSubmittedAt: new Date() },
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
    const payment = await prisma.salesOrder.findUnique({ where: { id: req.params.paymentId } });
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
    const payment = await prisma.salesOrder.update({
      where: { id: req.params.paymentId },
      data: { paymentStatus: 'PAID', paymentConfirmedById: req.adminSession!.user.id, paymentConfirmedAt: new Date() },
    });
    res.json(payment);
  } catch (error) {
    console.error('Authorize payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as paymentRoutes };
