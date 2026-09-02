import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// POST /api/crm/lead (submit CRM lead)
router.post('/lead', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { source, name, email, phone, notes, vehicleInterest } = req.body;
    const lead = await prisma.cRMLead.create({
      data: { source, name, email, phone, notes, vehicleInterest },
    });
    res.status(201).json({ success: true, id: lead.id });
  } catch (error) {
    console.error('Submit CRM lead error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as crmRoutes };
