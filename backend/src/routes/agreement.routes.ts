import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/agreement/:orderId (get agreement summary)
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true, vehicle: true, allocation: true, quotation: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    res.json(order);
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agreement/:orderId/sign (customer sign)
router.post('/:orderId/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { signatureData, signerName } = req.body;
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: { agreementSignedAt: new Date(), agreementSignatureData: signatureData, agreementSignerName: signerName },
    });
    res.json(order);
  } catch (error) {
    console.error('Sign agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agreement/:orderId/pdf (generate PDF)
router.get('/:orderId/pdf', async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.orderId },
      include: { customer: true, vehicle: true, allocation: true, quotation: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
    // TODO: Generate agreement PDF
    res.json({ order, pdfUrl: null });
  } catch (error) {
    console.error('Generate agreement PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agreement/:orderId/countersign-stamp (staff countersign)
router.post('/:orderId/countersign-stamp', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { signatureData } = req.body;
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: {
        agreementCountersignedAt: new Date(),
        agreementCountersignedById: req.adminSession!.user.id,
        agreementCountersignatureData: signatureData,
      },
    });
    res.json(order);
  } catch (error) {
    console.error('Countersign agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as agreementRoutes };
