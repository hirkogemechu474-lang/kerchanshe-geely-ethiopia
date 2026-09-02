import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// POST /api/visit/start (start visit)
router.post('/start', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    // The showroom QR is a static poster/screen — it never carries a
    // per-scan token or dealer id (see schema.prisma's ShowroomVisit
    // comment), so there is nothing to persist from the request body here.
    const visit = await prisma.showroomVisit.create({
      data: {
        userAgent: req.headers['user-agent'] || '',
      },
    });
    res.status(201).json(visit);
  } catch (error) {
    console.error('Start visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/visit/:id (get visit summary)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const visit = await prisma.showroomVisit.findUnique({ where: { id: req.params.id } });
    if (!visit) { res.status(404).json({ error: 'Visit not found' }); return; }
    res.json(visit);
  } catch (error) {
    console.error('Get visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/visit/:id (update selected action)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const visit = await prisma.showroomVisit.update({ where: { id: req.params.id }, data: req.body });
    res.json(visit);
  } catch (error) {
    console.error('Update visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/visit/:id/register (register with details)
router.post('/:id/register', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone } = req.body;
    const visit = await prisma.showroomVisit.update({
      where: { id: req.params.id },
      data: { fullName, email, phone, status: 'registered', registeredAt: new Date() },
    });

    res.json(visit);
  } catch (error) {
    console.error('Register visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as showroomVisitRoutes };
