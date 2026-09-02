import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/handover/:orderId (get handover summary)
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true, vehicle: true, allocation: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (error) {
    console.error('Get handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/handover/:orderId/sign (customer sign)
router.post('/:orderId/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { signatureData, signerName } = req.body;
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: { handoverSignedAt: new Date(), handoverSignatureData: signatureData, handoverSignerName: signerName },
    });
    res.json(order);
  } catch (error) {
    console.error('Sign handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/handover/:orderId/pdf (generate PDF)
router.get('/:orderId/pdf', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true, vehicle: true, allocation: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    // TODO: Generate handover PDF
    res.json({ order, pdfUrl: null });
  } catch (error) {
    console.error('Generate handover PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/handover/:orderId/countersign-stamp (staff countersign)
router.post('/:orderId/countersign-stamp', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { signatureData } = req.body;
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: {
        handoverCountersignedAt: new Date(),
        handoverCountersignedById: req.adminSession!.user.id,
        handoverCountersignatureData: signatureData,
      },
    });
    res.json(order);
  } catch (error) {
    console.error('Countersign handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as handoverRoutes };
