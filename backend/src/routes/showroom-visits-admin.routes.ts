import { Router, Request, Response } from 'express';
import { requireAdminApiSession } from '../middleware/auth';
import { showroomVisitRepository } from '../repositories';

// Admin-only showroom-visit routes, kept in a file separate from
// showroom-visits.routes.ts (which is mounted at /visit and holds the
// PUBLIC/customer-facing flow: POST /start, GET/PATCH /:id, POST
// /:id/register — none of those should gain requireAdminApiSession).
// This router is meant to be mounted directly at /admin/showroom-visits
// (top-level in index.ts), so its own paths resolve to exactly
// /api/admin/showroom-visits.
const router = Router();

router.use(requireAdminApiSession);

// GET /api/admin/showroom-visits (admin list) — see
// apps/admin/components/admin/showroom-visits/ShowroomVisitsList.tsx for
// the exact contract: ?page, ?status, response { visits, stats, total }
// (checked via res.ok, no success wrapper). PAGE_SIZE is a frontend
// constant (25), never sent as a query param, so it is fixed here too.
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 25;
    const status = req.query.status as string;

    const where = status ? { status } : undefined;
    const [visits, total, statusCounts] = await showroomVisitRepository.findPage(where, (page - 1) * pageSize, pageSize);

    // Stats are computed unfiltered (findPage's groupBy has no `where`),
    // matching the tab-count convention used elsewhere — the tab labels
    // (e.g. "Test Drive (N)") reflect the whole table regardless of the
    // currently selected filter tab.
    const counts: Record<string, number> = {};
    for (const row of statusCounts) counts[row.status] = row._count;
    const stats = {
      total: statusCounts.reduce((sum, row) => sum + row._count, 0),
      started: counts['started'] || 0,
      registered: counts['registered'] || 0,
      quote: counts['quote'] || 0,
      'test-drive': counts['test-drive'] || 0,
      purchase: counts['purchase'] || 0,
    };

    res.json({ visits, stats, total, page, pageSize });
  } catch (error) {
    console.error('List showroom visits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as showroomVisitAdminRoutes };
