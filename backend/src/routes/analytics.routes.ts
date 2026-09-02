import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession } from '../middleware/auth';
import { rateLimiters } from '../utils/rateLimit';

const router = Router();

// GET /api/analytics (admin analytics data)
router.get('/', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalOrders, totalRevenue, totalCustomers, totalJobCards] = await Promise.all([
      prisma.salesOrder.count({ where: { createdAt: { gte: startDate } } }),
      prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { createdAt: { gte: startDate }, status: 'DELIVERED' } }),
      prisma.user.count({ where: { role: 'customer', createdAt: { gte: startDate } } }),
      prisma.jobCard.count({ where: { createdAt: { gte: startDate } } }),
    ]);

    res.json({ totalOrders, totalRevenue: totalRevenue._sum?.totalPrice || 0, totalCustomers, totalJobCards });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/dashboard/stats (admin dashboard stats)
router.get('/dashboard/stats', requireAdminApiSession, async (req: Request, res: Response) => {
  try {
    const [totalVehicles, activeOrders, pendingQuotations, activeJobCards, totalCustomers, totalRevenue] = await Promise.all([
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.salesOrder.count({ where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
      prisma.quotation.count({ where: { status: { notIn: ['converted', 'closed'] } } }),
      prisma.jobCard.count({ where: { status: { notIn: ['INVOICED_CLOSED', 'CANCELLED'] } } }),
      prisma.user.count({ where: { role: 'customer' } }),
      prisma.salesOrder.aggregate({ _sum: { totalPrice: true }, where: { status: 'DELIVERED' } }),
    ]);

    res.json({ totalVehicles, activeOrders, pendingQuotations, activeJobCards, totalCustomers, totalRevenue: totalRevenue._sum?.totalPrice || 0 });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/analytics/vitals (web vitals collection)
router.post('/vitals', rateLimiters.contactForm, async (req: Request, res: Response) => {
  try {
    const { metric, value, url } = req.body;
    // No WebVital table exists in schema.prisma (this endpoint has no
    // current caller — apps/web/lib/performance.ts only console.logs
    // vitals client-side). Just log server-side rather than fabricating a
    // Prisma model/migration outside this fix's scope.
    console.log('[web-vitals]', { metric, value, url, userAgent: req.headers['user-agent'] || '' });
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Vitals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as analyticsRoutes };
