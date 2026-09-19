import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { rateLimiters } from '../utils/rateLimit';
import { dispatchNotification } from '../services/email/notifications.dispatch';
import { userRepository } from '../repositories';
import { env } from '../config/env';

const router = Router();

const ACTION_LABELS: Record<string, string> = {
  quote: 'requested a quotation',
  'test-drive': 'booked a test drive',
  purchase: 'went to complete a purchase',
};

// Staff-facing alerts only — never blocks the visitor-facing response, so a
// slow/broken SMTP server can't turn a kiosk tap into an error screen.
async function notifyManagers(payload: Parameters<typeof dispatchNotification>[0]) {
  try {
    const managerEmails = [...new Set(await userRepository.findManagerEmails())];
    if (managerEmails.length) {
      await dispatchNotification({ ...payload, to: managerEmails });
    }
  } catch (error: any) {
    console.error('[SHOWROOM VISIT NOTIFICATION ERROR]', error.message);
  }
}

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

    // The visitor's browser fires this PATCH without waiting for it (see
    // quote/test-drive/financing pages' `void fetch(...)`) and has already
    // moved on to its own confirmation — sending the reply first, then
    // notifying, keeps a slow SMTP round-trip from ever surfacing here.
    if (req.body.selectedAction && ACTION_LABELS[req.body.selectedAction]) {
      const label = ACTION_LABELS[req.body.selectedAction];
      const name = visit.fullName || 'A showroom visitor';
      void notifyManagers({
        type: 'showroom_visit',
        to: [],
        subject: `Showroom Visitor Update — ${name} ${label}`,
        data: {
          visitor: visit.fullName || 'Unknown',
          phone: visit.phone || 'N/A',
          email: visit.email || 'N/A',
          action: label,
          adminLink: `${env.urls.admin}/admin/showroom-visits`,
        },
        inApp: {
          type: 'showroom_visit',
          title: 'Showroom visitor update',
          body: `${name} ${label}.`,
          link: '/admin/showroom-visits',
          relatedModel: 'ShowroomVisit',
          relatedId: visit.id,
          priority: 'normal',
        },
      });
    }
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

    // Respond immediately — the visitor is standing at the kiosk waiting for
    // the next screen ("Register in seconds"), and a real SMTP round-trip
    // (or a retry on a transient error, see smtp.ts) can take several
    // seconds. Email + staff notification fire after the response instead
    // of blocking it.
    res.json(visit);

    if (email) {
      dispatchNotification({
        type: 'showroom_visit',
        to: [email],
        subject: 'Welcome to Geely Ethiopia — Thanks for Visiting',
        greetingName: fullName,
        data: {
          message: 'Thanks for registering at our showroom. Browse the full Geely lineup, and our team is on hand if you have any questions.',
        },
        ctas: [{ label: 'Browse Vehicles', url: `${env.urls.site}/models` }],
      }).catch((error: any) => console.error('[SHOWROOM VISIT CONFIRMATION EMAIL ERROR]', error.message));
    }

    void notifyManagers({
      type: 'showroom_visit',
      to: [],
      subject: `New Showroom Visitor — ${fullName}`,
      data: {
        fullName,
        phone: phone || 'N/A',
        email: email || 'N/A',
        adminLink: `${env.urls.admin}/admin/showroom-visits`,
      },
      inApp: {
        type: 'showroom_visit',
        title: 'New showroom visitor registered',
        body: `${fullName} (${phone || 'no phone'}) just registered at the showroom kiosk.`,
        link: '/admin/showroom-visits',
        relatedModel: 'ShowroomVisit',
        relatedId: visit.id,
        priority: 'normal',
      },
    });
  } catch (error) {
    console.error('Register visit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as showroomVisitRoutes };
