import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getDashboardStats } from '@/lib/services/analytics/dashboardStatsService';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const stats = await getDashboardStats();

  return NextResponse.json({ stats });
}
