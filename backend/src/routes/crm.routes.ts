import { Router, Request, Response } from 'express';
import { rateLimiters } from '../utils/rateLimit';
import { leadService } from '../services/crm/lead.service';

const router = Router();

// POST /api/crm/lead (submit CRM lead) — there is no CRMLead model; a CRM
// lead is a Quotation row (source-tagged), same as every other lead-capture
// endpoint in this codebase (see leadService and Quotation.source's doc
// comment). The old wiring called a nonexistent prisma.cRMLead model.
router.post('/lead', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { source, name, email, phone, notes, vehicleInterest } = req.body;
    const result = await leadService.submit({ name, email, phone, vehicleInterest, message: notes, source });
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.status(201).json({ success: true, id: result.data.id });
  } catch (error) {
    console.error('Submit CRM lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as crmRoutes };
