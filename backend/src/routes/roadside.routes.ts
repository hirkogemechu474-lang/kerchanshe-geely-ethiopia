import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';

const router = Router();

// GET /api/roadside-requests (admin list)
router.get('/', requireAdminApiSession, requirePermission('canManageService'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.roadsideAssistanceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.roadsideAssistanceRequest.count({ where }),
    ]);

    res.json({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error('List roadside requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roadside-requests/:id (admin detail)
router.get('/:id', requireAdminApiSession, requirePermission('canManageService'), async (req: Request, res: Response) => {
  try {
    const request = await prisma.roadsideAssistanceRequest.findUnique({ where: { id: req.params.id } });
    if (!request) { res.status(404).json({ error: 'Roadside assistance request not found' }); return; }
    res.json(request);
  } catch (error) {
    console.error('Get roadside request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/roadside-requests/:id/status (dispatch/resolve/cancel)
router.patch('/:id/status', requireAdminApiSession, requirePermission('canManageService'), async (req: Request, res: Response) => {
  try {
    const { status, assignedTo } = req.body ?? {};
    if (!status) { res.status(400).json({ error: 'status is required' }); return; }

    const data: any = { status };
    if (assignedTo !== undefined) data.assignedTo = assignedTo || null;
    if (status === 'RESOLVED' || status === 'CANCELLED') data.resolvedAt = new Date();

    const request = await prisma.roadsideAssistanceRequest.update({ where: { id: req.params.id }, data });
    res.json(request);
  } catch (error) {
    console.error('Update roadside request status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as roadsideRoutes };
