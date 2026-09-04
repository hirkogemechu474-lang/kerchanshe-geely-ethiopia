import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { orderHandoverService } from '../services/sales/orderHandover.service';

const router = Router();

// GET /api/handover/:orderId (get handover summary) — customer-facing,
// reached via the emailed sign-off link (see orderHandoverService.
// generateHandoverLink), so it's gated by the signed token, not an admin
// session. The old wiring skipped verifyLinkToken entirely and queried
// nonexistent `customer`/`vehicle`/`allocation` relations on SalesOrder.
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const result = await orderHandoverService.getHandoverView(req.params.orderId, token);
    if (!result.ok) {
      res.status(result.error === 'Order not found.' ? 404 : 403).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/handover/:orderId/sign (customer sign)
router.post('/:orderId/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const { signatureDataUrl, photoUrl } = req.body;
    const handoverSignedDocumentUrl = photoUrl || signatureDataUrl;
    if (!handoverSignedDocumentUrl) { res.status(400).json({ error: 'A signature or a signed photo is required.' }); return; }

    const result = await orderHandoverService.signHandover(req.params.orderId, token, handoverSignedDocumentUrl);
    if (!result.ok) {
      res.status(result.error === 'Order not found.' ? 404 : 400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Sign handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/handover/:orderId/pdf (view/download handover confirmation PDF)
router.get('/:orderId/pdf', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const result = await orderHandoverService.generateHandoverPdf(req.params.orderId, token);
    if (!result.ok || !result.data) {
      res.status(result.error === 'Order not found.' ? 404 : 403).json({ error: result.error });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="handover-confirmation-${req.params.orderId}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Generate handover PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/handover/:orderId/countersign-stamp (staff countersign)
router.post('/:orderId/countersign-stamp', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: {
        handoverCountersignedAt: new Date(),
        handoverCountersignedById: req.adminSession!.user.id,
      },
    });
    res.json(order);
  } catch (error) {
    console.error('Countersign handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as handoverRoutes };
