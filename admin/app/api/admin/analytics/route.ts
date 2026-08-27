import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getAnalyticsData } from '@/lib/services/analytics/analyticsService';

export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const analyticsData = await getAnalyticsData(session!.user.permissions);

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
