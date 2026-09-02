import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// POST /api/newsletter/subscribe (subscribe email)
router.post('/subscribe', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email is required' }); return; }

    // NOTE: NewsletterSubscriber has no `isActive` boolean — subscription
    // state is tracked via the `status` string field (default "subscribed").
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      if (existing.status === 'subscribed') { res.status(409).json({ error: 'Email already subscribed' }); return; }
      await prisma.newsletterSubscriber.update({ where: { email: email.toLowerCase() }, data: { status: 'subscribed' } });
      res.json({ success: true, message: 'Re-subscribed successfully' });
      return;
    }

    await prisma.newsletterSubscriber.create({ data: { email: email.toLowerCase() } });
    res.status(201).json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as newsletterRoutes };
