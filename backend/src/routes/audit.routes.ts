import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { auditService } from '../services/audit/audit.service';

const router = Router();

// GET /api/audit/stats - Get audit statistics
router.get('/stats', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await auditService.getStats();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audit/:entityType/:entityId - Get audit trail for an entity
router.get('/:entityType/:entityId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await auditService.getTrail(req.params.entityType, req.params.entityId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/audit/activity - Get recent audit activity
router.get('/activity', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { entityType, performedById, page, pageSize } = req.query;
    const result = await auditService.getRecentActivity({
      entityType: entityType as string,
      performedById: performedById as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get audit activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as auditRoutes };