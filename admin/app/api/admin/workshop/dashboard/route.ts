import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getWorkshopSummary } from '@/lib/services/workshop/dashboardSummary';

// Workshop Live Dashboard (BRD Screen 1 / FR-701): bays busy/total, jobs
// today, average turnaround, pending-approval count, bay tiles, today's job
// list. Aggregation lives in lib/workshop/dashboardSummary.ts, shared with
// the unified admin Dashboard (app/api/admin/analytics).
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { kpis, bays, jobCards, generatedAt } = await getWorkshopSummary();

  return NextResponse.json({ ...kpis, bays, jobCards, generatedAt });
}
