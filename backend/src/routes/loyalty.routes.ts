import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { loyaltyService } from '../services/loyalty/loyalty.service';

const router = Router();

// ─── Admin Routes ───────────────────────────────────────────────────────────

// GET /api/loyalty — admin listing with pagination, tier filter, search
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { tier, search, page, pageSize } = req.query;
    const result = await loyaltyService.listAll({
      tier: tier as string,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
    });
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('List loyalty accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/loyalty/analytics — admin dashboard stats
router.get('/analytics', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await loyaltyService.getAnalytics();
    if (!result.ok) { res.status(500).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Loyalty analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/loyalty/tier-benefits — get tier benefits configuration
router.get('/tier-benefits', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    res.json(loyaltyService.getTierBenefits());
  } catch (error) {
    console.error('Get tier benefits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/loyalty/:customerId — get specific loyalty account
router.get('/:customerId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await loyaltyService.getByCustomerId(req.params.customerId);
    if (!result.ok) { res.status(404).json({ error: result.error }); return; }
    if (!result.data) { res.status(404).json({ error: 'Loyalty account not found.' }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get loyalty account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/loyalty/adjust — manually adjust points (admin)
router.post('/adjust', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { customerId, points, reason } = req.body;
    if (!customerId || !points || !reason) {
      res.status(400).json({ error: 'customerId, points, and reason are required.' });
      return;
    }

    const result = await loyaltyService.adjustPoints({
      customerId,
      points: parseInt(points),
      reason,
      adjustedById: req.adminSession!.user.id,
    });

    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Adjust loyalty points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/loyalty/redeem — redeem points (admin-initiated)
router.post('/redeem', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { customerId, points, reason } = req.body;
    if (!customerId || !points || !reason) {
      res.status(400).json({ error: 'customerId, points, and reason are required.' });
      return;
    }

    const result = await loyaltyService.redeemPoints({
      customerId,
      points: parseInt(points),
      reason,
    });

    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Redeem loyalty points error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as loyaltyRoutes };
