import { Router, Request, Response } from 'express';
import { requireAdminApiSession, requirePermission } from '../middleware/auth';
import { partRequestRepository } from '../repositories';

const router = Router();

// All parts-requests admin routes require an admin session.
router.use(requireAdminApiSession);
// Was session-only — any authenticated staff member of any role could read,
// update the status of, or delete parts requests. canManageSpareParts
// matches AdminLayout.tsx's "Manage Parts Requests" nav item and both
// apps/admin/app/admin/parts-requests page.tsx's useAdminAuth guard (the
// Spare Parts nav uses this one key even for list/view pages — there's no
// separate canViewSpareParts split in practice).
router.use(requirePermission('canManageSpareParts'));

// GET /api/admin/parts-requests (admin list) — see
// apps/admin/app/admin/parts-requests/page.tsx for the exact contract:
// ?page, ?q (search), ?status, response { success, requests, stats, total }.
// PAGE_SIZE is a frontend constant (25), never sent as a query param, so it
// is fixed here too.
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 25;
    const search = req.query.q as string;
    const status = req.query.status as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [requests, total, statusCounts] = await partRequestRepository.findPage(where, (page - 1) * pageSize, pageSize);

    // Stats are computed unfiltered (findPage's groupBy has no `where`),
    // matching the tab/stat-tile convention used by orders/quotations —
    // the counts reflect the whole table regardless of the current
    // search/status filter.
    const counts: Record<string, number> = {};
    for (const row of statusCounts) counts[row.status] = row._count;
    const stats = {
      total: statusCounts.reduce((sum, row) => sum + row._count, 0),
      new: counts['new'] || 0,
      quoted: counts['quoted'] || 0,
      closed: counts['closed'] || 0,
    };

    res.json({ success: true, requests, stats, total, page, pageSize });
  } catch (error) {
    console.error('List part requests error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/parts-requests/:id (admin detail)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const request = await partRequestRepository.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, error: 'Part request not found' });
      return;
    }
    res.json({ success: true, request });
  } catch (error) {
    console.error('Get part request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/admin/parts-requests/:id (update status)
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, error: 'status is required' });
      return;
    }
    const request = await partRequestRepository.update(req.params.id, { status });
    res.json({ success: true, request });
  } catch (error) {
    console.error('Update part request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/admin/parts-requests/:id (admin delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await partRequestRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete part request error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { router as partRequestRoutes };
