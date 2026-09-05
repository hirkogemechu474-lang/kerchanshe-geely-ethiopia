import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { inAppNotificationRepository } from '../repositories/inAppNotification.repository';

const router = Router();

// GET /api/notifications — list current user's notifications
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const userId = req.adminSession!.user.id;
    const unreadOnly = req.query.unread === 'true';
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const [notifications, unreadCount] = await Promise.all([
      inAppNotificationRepository.findByUser(userId, { unreadOnly, limit, offset }),
      inAppNotificationRepository.countUnread(userId),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/notifications/unread-count — just the count (lightweight for polling)
router.get('/unread-count', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const userId = req.adminSession!.user.id;
    const unreadCount = await inAppNotificationRepository.countUnread(userId);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const userId = req.adminSession!.user.id;
    await inAppNotificationRepository.markAsRead(req.params.id, userId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const userId = req.adminSession!.user.id;
    await inAppNotificationRepository.markAllAsRead(userId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as notificationRoutes };
