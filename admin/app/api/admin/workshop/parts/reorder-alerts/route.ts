import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getReorderAlerts } from '@/lib/services/workshop/reorderAlertsService';

// FR-403: parts at or below their reorder level, live-computed on read
// rather than pushed — see docs/SWMS-INTEGRATION-BACKLOG.md for why no
// push/SMS/email channel is wired up for this alert yet.
export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewSpareParts) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await getReorderAlerts();

  return NextResponse.json(result);
}
