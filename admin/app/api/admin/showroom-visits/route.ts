import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { showroomVisitRepository } from '@/repositories/showroomVisitRepository';

// GET - Paginated showroom QR walk-in visits, optionally filtered by
// status. Status counts are computed across the whole table (not just the
// current page/filter) so the tab counts stay accurate once paginated —
// same pattern as /api/admin/quotations.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = 25;
  const where = status ? { status } : undefined;

  const [visits, total, statusCounts] = await showroomVisitRepository.findPage(where, (page - 1) * pageSize, pageSize);

  const countFor = (s: string) => statusCounts.find((c) => c.status === s)?._count ?? 0;

  return NextResponse.json({
    visits,
    total,
    page,
    pageSize,
    stats: {
      total: statusCounts.reduce((sum, c) => sum + c._count, 0),
      started: countFor('started'),
      registered: countFor('registered'),
      quote: countFor('quote'),
      'test-drive': countFor('test-drive'),
      purchase: countFor('purchase'),
    },
  });
}
