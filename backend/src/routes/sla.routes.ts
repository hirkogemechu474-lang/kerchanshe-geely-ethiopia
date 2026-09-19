import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { slaTimerService } from '../services/sla/sla.timer.service';

const router = Router();

// Every route here only ever required a valid admin session — any
// authenticated staff member of any role could read SLA data and start/
// complete/escalate timers. canManageOrders matches AdminLayout.tsx's "SLA
// Monitor" nav item and the admin page's own requirePermission
// ('canManageOrders') guard.
const gate = requirePermission('canManageOrders');

// GET /api/sla/dashboard - Get SLA dashboard metrics
router.get('/dashboard', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await slaTimerService.getSLADashboard();
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get SLA dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sla/:entityType/:entityId - Get SLA status for an entity
router.get('/:entityType/:entityId', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await slaTimerService.getSLAStatus(req.params.entityType, req.params.entityId);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get SLA status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sla/start - Start an SLA timer
router.post('/start', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, stage, assignedTo } = req.body;
    if (!entityType || !entityId || !stage) {
      res.status(400).json({ error: 'entityType, entityId, and stage are required' });
      return;
    }

    const result = await slaTimerService.startTimer(entityType, entityId, stage, assignedTo);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Start SLA timer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sla/complete - Complete an SLA timer
router.post('/complete', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, stage } = req.body;
    if (!entityType || !entityId || !stage) {
      res.status(400).json({ error: 'entityType, entityId, and stage are required' });
      return;
    }

    const result = await slaTimerService.completeTimer(entityType, entityId, stage);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true, withinSLA: result.withinSLA, minutesTaken: result.minutesTaken });
  } catch (error) {
    console.error('Complete SLA timer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sla/check-breached - Check and escalate breached SLAs
router.post('/check-breached', requireAdminApiSession, gate, async (req: Request, res: Response) => {
  try {
    const result = await slaTimerService.checkBreachedSLAs();
    res.json(result);
  } catch (error) {
    console.error('Check breached SLAs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as slaRoutes };