import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';

const router = Router();

// DEPRECATED: These legacy routes duplicate functionality now available through:
// - POST /api/public/orders/:orderId/payment/mock-pay (public mock payment)
// - POST /api/public/orders/:orderId/payment/proof (bank transfer proof)
// - POST /api/orders/:id/payment/confirm (admin confirm/reject)
//
// Kept for backward compatibility with:
// - apps/web/app/financing/apply/page.tsx (POST /initiate)
// - apps/web/app/payment/mock/[paymentId]/page.tsx (GET /:paymentId, POST /:paymentId/authorize)
//
// New code should use the public or orders payment routes instead.

// POST /api/payments/initiate (initiate payment — used by financing flow)
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
