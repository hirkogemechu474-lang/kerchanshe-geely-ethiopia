import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { repeatPurchaseService } from '../services/customer/repeatPurchase.service';

const router = Router();

// GET /api/repeat-purchase/pipeline - Get upgrade pipeline dashboard
router.get('/pipeline', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await repeatPurchaseService.getPipelineDashboard();
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get pipeline dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/repeat-purchase - List opportunities
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status, opportunityType, assignedTo, page, pageSize } = req.query;
    const result = await repeatPurchaseService.list({
      status: status as string,
      opportunityType: opportunityType as string,
      assignedTo: assignedTo as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('List opportunities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/repeat-purchase - Create an opportunity
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await repeatPurchaseService.createOpportunity(req.body);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.status(201).json(result.data);
  } catch (error) {
    console.error('Create opportunity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/repeat-purchase/detect - Auto-detect upgrade opportunities
router.post('/detect', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await repeatPurchaseService.detectOpportunities();
    if (!result.ok) { res.status(400).json({ error: 'Detection failed' }); return; }
    res.json(result);
  } catch (error) {
    console.error('Detect opportunities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/repeat-purchase/customer/:customerId - Get opportunities by customer
router.get('/customer/:customerId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await repeatPurchaseService.getByCustomer(req.params.customerId);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Get customer opportunities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/repeat-purchase/:id/status - Update opportunity status
router.post('/:id/status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    if (!status) { res.status(400).json({ error: 'status is required' }); return; }
    const result = await repeatPurchaseService.updateStatus(req.params.id, status, req.adminSession!.user.id, notes);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json(result.data);
  } catch (error) {
    console.error('Update opportunity status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as repeatPurchaseRoutes };