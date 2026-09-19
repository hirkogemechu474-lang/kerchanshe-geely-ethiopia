import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { commissionService } from '../services/sales/commission.service';

const router = Router();

// Was session-only — any authenticated staff member could view/reassign
// commissions and mark them earned/paid. canManageOrders matches the
// '/admin/commissions' nav entry (AdminLayout.tsx) and the gate already used
// by apps/admin/app/admin/commissions/page.tsx. AdminPermissions has no
// separate canViewOrders, so this covers both read and write here.
router.use(requireAdminApiSession);
router.use(requirePermission('canManageOrders'));

// GET /api/commission/:orderId - Get commission details for an order
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const result = await commissionService.getCommissionDetails(req.params.orderId);
    if (!result.ok) {
      res.status(result.error === 'Order not found.' ? 404 : 400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('Get commission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/commission - List commissions with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, agentId, page, pageSize } = req.query;
    const result = await commissionService.list({
      status: status as string,
      agentId: agentId as string,
      page: page ? parseInt(page as string) : undefined,
      pageSize: pageSize ? parseInt(pageSize as string) : undefined,
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result.data);
  } catch (error) {
    console.error('List commissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commission/:orderId/reassign - Reassign commission ownership
router.post('/:orderId/reassign', async (req: Request, res: Response) => {
  try {
    const { newAgentId, splitPercent, note } = req.body;
    if (!newAgentId) {
      res.status(400).json({ error: 'newAgentId is required' });
      return;
    }

    const result = await commissionService.reassign(
      req.params.orderId,
      newAgentId,
      req.adminSession!.user.id,
      splitPercent ?? 60,
      note
    );

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true, order: result.data });
  } catch (error) {
    console.error('Reassign commission error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commission/:orderId/mark-earned - Mark commission as earned
router.post('/:orderId/mark-earned', async (req: Request, res: Response) => {
  try {
    const result = await commissionService.markEarned(
      req.params.orderId,
      req.adminSession!.user.id
    );

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Mark commission earned error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/commission/:orderId/mark-paid - Mark commission as paid (payroll)
router.post('/:orderId/mark-paid', async (req: Request, res: Response) => {
  try {
    const { paymentRef } = req.body;
    if (!paymentRef) {
      res.status(400).json({ error: 'paymentRef is required' });
      return;
    }

    const result = await commissionService.markPaid(
      req.params.orderId,
      req.adminSession!.user.id,
      paymentRef
    );

    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Mark commission paid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as commissionRoutes };