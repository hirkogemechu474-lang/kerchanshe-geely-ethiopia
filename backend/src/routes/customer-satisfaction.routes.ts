import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { customerSatisfactionService } from '../services/customer/customerSatisfaction.service';

const router = Router();

// Was session-only — any authenticated staff member could read NPS/retention
// data and complete follow-ups. canManageCustomers matches the
// '/admin/satisfaction' nav entry (AdminLayout.tsx) and the gate already
// used by apps/admin/app/admin/satisfaction/page.tsx.
router.use(requireAdminApiSession);
router.use(requirePermission('canManageCustomers'));

// GET /api/customer-satisfaction/nps - Get NPS metrics
router.get('/nps', async (req: Request, res: Response) => {
  try {
    const result = await customerSatisfactionService.getNPSMetrics();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get NPS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customer-satisfaction/follow-ups - Get pending follow-ups
router.get('/follow-ups', async (req: Request, res: Response) => {
  try {
    const agentId = req.query.agentId as string;
    const result = await customerSatisfactionService.getPendingFollowUps(agentId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/customer-satisfaction/follow-ups/:id/complete - Complete a follow-up
router.post('/follow-ups/:id/complete', async (req: Request, res: Response) => {
  try {
    const { outcome, notes, npsScore, satisfactionScore, wouldRecommend, callbackDate } = req.body;
    if (!outcome) { res.status(400).json({ error: 'outcome is required' }); return; }
    const result = await customerSatisfactionService.completeFollowUp(req.params.id, {
      outcome, notes, npsScore, satisfactionScore, wouldRecommend,
      callbackDate: callbackDate ? new Date(callbackDate) : undefined,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Complete follow-up error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/customer-satisfaction/retention/:customerId - Get retention score
router.get('/retention/:customerId', async (req: Request, res: Response) => {
  try {
    const result = await customerSatisfactionService.calculateRetentionScore(req.params.customerId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get retention score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/customer-satisfaction/schedule-follow-ups/:orderId - Auto-schedule post-delivery follow-ups
router.post('/schedule-follow-ups/:orderId', async (req: Request, res: Response) => {
  try {
    const result = await customerSatisfactionService.schedulePostDeliveryFollowUps(req.params.orderId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json({ success: true });
  } catch (error) {
    console.error('Schedule follow-ups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as customerSatisfactionRoutes };