import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { dashboardService } from '../services/dashboard/dashboard.service';

const router = Router();

// GET /api/dashboard/crm - Get comprehensive CRM dashboard
router.get('/crm', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getCRMDashboard();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get CRM dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/agent-performance - Get agent performance report
router.get('/agent-performance', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { agentId, startDate, endDate } = req.query;
    const result = await dashboardService.getAgentPerformance({
      agentId: agentId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get agent performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/lead-sources - Get lead source analytics
router.get('/lead-sources', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getLeadSourceAnalytics();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get lead sources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/dashboard/revenue-trend - Get monthly revenue trend
router.get('/revenue-trend', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await dashboardService.getRevenueTrend();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get revenue trend error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as dashboardRoutes };