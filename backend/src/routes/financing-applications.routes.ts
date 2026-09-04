import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { FinancingApplicationService } from '../services/financing/financingApplication.service';

const router = Router();

// POST /api/financing-applications (create from lead)
router.post('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const application = await FinancingApplicationService.create(req.body);
    if (!application.ok) {
      return res.status(400).json({ error: application.error });
    }
    res.status(201).json({ success: true, application: application.data });
  } catch (error) {
    console.error('Create financing application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/financing-applications/lead/:leadId (get by lead)
router.get('/lead/:leadId', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const result = await FinancingApplicationService.getByLeadId(req.params.leadId);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, application: result.data });
  } catch (error) {
    console.error('Get financing application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing-applications/:id/status (update status)
router.post('/:id/status', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { status, rejectionReason, documentsSubmitted, paymentProofUrl } = req.body;
    const result = await FinancingApplicationService.updateStatus(req.params.id, {
      status,
      rejectionReason,
      documentsSubmitted,
      paymentProofUrl,
    });
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, application: result.data });
  } catch (error) {
    console.error('Update financing application status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing-applications/:id/approve (approve financing)
router.post('/:id/approve', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { isConditional } = req.body;
    const result = await FinancingApplicationService.approve(req.params.id, req.adminSession!.user.id, isConditional);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, application: result.data });
  } catch (error) {
    console.error('Approve financing application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/financing-applications/:id/decline (decline financing)
router.post('/:id/decline', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const { rejectionReason } = req.body;
    const result = await FinancingApplicationService.decline(req.params.id, rejectionReason);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, application: result.data });
  } catch (error) {
    console.error('Decline financing application error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as financingApplicationsRoutes };