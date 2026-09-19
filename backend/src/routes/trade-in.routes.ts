import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { TradeInEvaluationService } from '../services/trade-in/tradeInEvaluation.service';

const router = Router();

// Every route here only ever required a valid admin session. Trade-in
// evaluations are surfaced inside the Quotation detail page
// (TradeInEvaluationPanel.tsx, rendered from
// apps/admin/app/admin/quotations/[id]/page.tsx), which passes
// session.user.permissions.canManageQuotations as that panel's `canManage`
// prop (gating its one mutating action, approve) and itself guards on
// canViewQuotations — so this router is split to match: view -> read the
// evaluation, manage -> create/approve/annotate it.
const viewGate = requirePermission('canViewQuotations');
const manageGate = requirePermission('canManageQuotations');

// POST /api/trade-in (create trade-in evaluation)
router.post('/', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const evaluation = await TradeInEvaluationService.create(req.body);
    if (!evaluation.ok) {
      return res.status(400).json({ error: evaluation.error });
    }
    res.status(201).json({ success: true, evaluation: evaluation.data });
  } catch (error) {
    console.error('Create trade-in evaluation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trade-in/lead/:leadId (get evaluation by lead)
router.get('/lead/:leadId', requireAdminApiSession, viewGate, async (req: Request, res: Response) => {
  try {
    const result = await TradeInEvaluationService.getByLeadId(req.params.leadId);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, evaluation: result.data });
  } catch (error) {
    console.error('Get trade-in evaluation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trade-in/:id/approve (approve/reject evaluation)
router.post('/:id/approve', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const { approvalStatus, evaluatedValue, internalNotes } = req.body;
    const result = await TradeInEvaluationService.updateEvaluation(req.params.id, {
      approvalStatus,
      evaluatedValue,
      approvedById: req.adminSession!.user.id,
      approvedAt: new Date(),
      internalNotes,
    });
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, evaluation: result.data });
  } catch (error) {
    console.error('Approve trade-in evaluation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/trade-in/:id/notes (add internal notes)
router.post('/:id/notes', requireAdminApiSession, manageGate, async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    const result = await TradeInEvaluationService.addInternalNotes(req.params.id, notes);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Add trade-in evaluation notes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as tradeInRoutes };