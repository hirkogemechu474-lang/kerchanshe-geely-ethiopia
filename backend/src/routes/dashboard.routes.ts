import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { dashboardService } from '../services/dashboard/dashboard.service';

const router = Router();

// Manager-tier only — same gate as the Next.js CRM Dashboard page
// (canViewExecutiveDashboards), so the underlying data can't be pulled
// directly by an authenticated session that the page itself would refuse.
// requirePermission reads req.adminSession, so it must run after
// requireAdminApiSession populates it — hence per-route, in this order,
// not a single router-level .use() ahead of the session check.
const guard = [requireAdminApiSession, requirePermission('canViewExecutiveDashboards')];

// GET /api/dashboard/crm - Get comprehensive CRM dashboard
router.get('/crm', guard, async (req: Request, res: Response) => {
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
router.get('/agent-performance', guard, async (req: Request, res: Response) => {
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
router.get('/lead-sources', guard, async (req: Request, res: Response) => {
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
router.get('/revenue-trend', guard, async (req: Request, res: Response) => {
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