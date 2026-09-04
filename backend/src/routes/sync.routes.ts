import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { crmWorkshopSync } from '../services/sync/crmWorkshopSync';

const router = Router();

// POST /api/sync/delivered-vehicle/:orderId - Sync delivered vehicle to customer/workshop
router.post('/delivered-vehicle/:orderId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await crmWorkshopSync.syncDeliveredVehicle(req.params.orderId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result);
  } catch (error) {
    console.error('Sync delivered vehicle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/sync/service-completion/:jobCardId - Sync service completion to CRM
router.post('/service-completion/:jobCardId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await crmWorkshopSync.syncServiceCompletion(req.params.jobCardId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result);
  } catch (error) {
    console.error('Sync service completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sync/customer-360/:customerId - Get customer 360 view
router.get('/customer-360/:customerId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await crmWorkshopSync.getCustomer360(req.params.customerId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get customer 360 error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/sync/upgrade-opportunities - Find upgrade opportunities from service data
router.get('/upgrade-opportunities', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await crmWorkshopSync.findUpgradeOpportunities();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Find upgrade opportunities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as syncRoutes };