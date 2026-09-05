import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { orderAgreementService } from '../services/sales/orderAgreement.service';

const router = Router();

// GET /api/agreement/:orderId (get agreement summary) — customer-facing,
// reached via the emailed sign link (see orderAgreementService.
// generateAgreementLink), so it's gated by the signed token, not an admin
// session. The old wiring skipped verifyLinkToken entirely and queried
// nonexistent `customer`/`vehicle`/`allocation` relations on SalesOrder.
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const result = await orderAgreementService.getAgreementView(req.params.orderId, token);
    if (!result.ok) {
      res.status(result.error === 'Order not found.' ? 404 : 403).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agreement/:orderId/sign (customer sign)
router.post('/:orderId/sign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const { signatureDataUrl, photoUrl } = req.body;
    const signedDocumentUrl = photoUrl || signatureDataUrl;
    if (!signedDocumentUrl) { res.status(400).json({ error: 'A signature or a signed photo is required.' }); return; }

    const result = await orderAgreementService.signAgreement(req.params.orderId, token, signedDocumentUrl);
    if (!result.ok) {
      res.status(result.error === 'Order not found.' ? 404 : 400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Sign agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/agreement/:orderId/pdf (view/download agreement PDF)
router.get('/:orderId/pdf', async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const result = await orderAgreementService.generateAgreementPdf(req.params.orderId, token);
    if (!result.ok || !result.data) {
      res.status(result.error === 'Order not found.' ? 404 : 403).json({ error: result.error });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="sales-agreement-${req.params.orderId}.pdf"`);
    res.send(result.data);
  } catch (error) {
    console.error('Generate agreement PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/agreement/:orderId/countersign-stamp (staff countersign)
router.post('/:orderId/countersign-stamp', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId } });
    if (!existing) { res.status(404).json({ error: 'Order not found' }); return; }
    if (!existing.signedAt || !existing.signedDocumentUrl) {
      res.status(400).json({ error: 'The customer must sign the agreement before manager countersignature.' });
      return;
    }
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: {
        countersignedAt: new Date(),
        countersignedById: req.adminSession!.user.id,
      },
    });
    res.json(order);
  } catch (error) {
    console.error('Countersign agreement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as agreementRoutes };
