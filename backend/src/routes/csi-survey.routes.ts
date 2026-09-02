import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/csi-survey/:jobCardId (check eligibility)
router.get('/:jobCardId', async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({
      where: { id: req.params.jobCardId },
      include: { customer: true, vehicle: true },
    });
    if (!jobCard) { res.status(404).json({ error: 'Job card not found' }); return; }
    if (jobCard.status !== 'completed') { res.status(400).json({ error: 'Job card not completed yet' }); return; }

    const existingSurvey = await prisma.cSISurvey.findUnique({ where: { jobCardId: req.params.jobCardId } });
    if (existingSurvey) { res.status(400).json({ error: 'Survey already submitted' }); return; }

    res.json({ eligible: true, customer: jobCard.customer, vehicle: jobCard.vehicle });
  } catch (error) {
    console.error('Check CSI eligibility error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/csi-survey/:jobCardId (submit survey)
router.post('/:jobCardId', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const jobCard = await prisma.jobCard.findUnique({ where: { id: req.params.jobCardId } });
    if (!jobCard) { res.status(404).json({ error: 'Job card not found' }); return; }
    if (jobCard.status !== 'completed') { res.status(400).json({ error: 'Job card not completed yet' }); return; }

    const existingSurvey = await prisma.cSISurvey.findUnique({ where: { jobCardId: req.params.jobCardId } });
    if (existingSurvey) { res.status(400).json({ error: 'Survey already submitted' }); return; }

    const survey = await prisma.cSISurvey.create({
      data: { jobCardId: req.params.jobCardId, ...req.body },
    });

    res.status(201).json({ success: true, id: survey.id });
  } catch (error) {
    console.error('Submit CSI survey error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as csiSurveyRoutes };
