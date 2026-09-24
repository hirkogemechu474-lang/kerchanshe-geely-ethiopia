import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';
import { verifyLinkToken } from '../utils/secureLink';
import { orderHandoverService } from '../services/sales/orderHandover.service';
import { documentSignatureRepository, userRepository } from '../repositories';
import { sendPdf } from '../utils/sendPdf';

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
    sendPdf(req, res, result.data, { filename: `handover-confirmation-${req.params.orderId}.pdf`, title: `Vehicle Handover Note` });
  } catch (error) {
    console.error('Generate handover PDF error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/handover/:orderId/countersign-stamp (staff countersign) — was
// session-only, so any authenticated staff member (not just a manager) could
// stamp a handover as countersigned. canCountersignAgreements is the
// permission this exact action's name maps to, and is what the other
// manager-approval gates on this same handover/delivery flow use (see
// orders.routes.ts's /delivery-hold and /payment/verify, immediately
// upstream of this step).
router.post('/:orderId/countersign-stamp', requireAdminApiSession, requirePermission('canCountersignAgreements'), async (req: Request, res: Response) => {
  try {
    const order = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: {
        handoverCountersignedAt: new Date(),
        handoverCountersignedById: req.adminSession!.user.id,
      },
    });

    try {
      const manager = await userRepository.findByIdSlim(req.adminSession!.user.id);
      await documentSignatureRepository.upsert('HANDOVER', order.id, 'manager', {
        signedByName: manager?.name ?? req.adminSession!.user.name,
        signatureUrl: manager?.signatureUrl ?? null,
        signedByUserId: req.adminSession!.user.id,
      });
    } catch {
      // Signature-log write failure should not block countersigning.
    }

    res.json(order);
  } catch (error) {
    console.error('Countersign handover error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/handover/:orderId/countersign (manager countersign via email link)
router.post('/:orderId/countersign', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const token = (req.query.token as string) || '';
    const { signatureDataUrl, photoUrl, signedByName } = req.body;
    const signatureUrl = photoUrl || signatureDataUrl || null;

    if (!verifyLinkToken(token, 'handover-countersign', req.params.orderId)) {
      res.status(403).json({ error: 'Invalid or expired link.' });
      return;
    }

    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.orderId } });
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }

    if (!order.handoverSignedAt) {
      res.status(400).json({ error: 'The customer must sign the handover before manager countersignature.' });
      return;
    }

    const updated = await prisma.salesOrder.update({
      where: { id: req.params.orderId },
      data: { handoverCountersignedAt: new Date() },
    });

    try {
      await documentSignatureRepository.upsert('HANDOVER', order.id, 'manager', {
        signedByName: (typeof signedByName === 'string' && signedByName.trim()) || 'Manager (via link)',
        signatureUrl,
      });
    } catch {
      // Signature-log write failure should not block countersigning.
    }

    res.json(updated);
  } catch (error) {
    console.error('Handover countersign (link) error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as handoverRoutes };
