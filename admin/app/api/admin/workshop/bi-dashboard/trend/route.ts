import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getWorkshopBiTrend } from '@/lib/services/workshop/biSummary';

// Multi-month view of the same KPIs as /api/admin/workshop/bi-dashboard —
// the dashboard was snapshot-only (one month at a time); this adds the
// trend the SWMS roadmap called out as missing. Same permission as the
// snapshot endpoint since it's the same underlying data.
export async function GET(request: Request) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewReports) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const monthsParam = Number(searchParams.get('months'));
  const months = Number.isFinite(monthsParam) && monthsParam > 0 ? monthsParam : 6;

  const trend = await getWorkshopBiTrend(months);
  return NextResponse.json({ trend });
}
