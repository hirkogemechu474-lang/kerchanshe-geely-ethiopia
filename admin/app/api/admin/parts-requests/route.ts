import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listPartRequests } from '@/lib/services/parts/partRequestService';

// GET - List part requests (supports search + status filter)
export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);

    const result = await listPartRequests(q, status, page);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching part requests:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch part requests' }, { status: 500 });
  }
}
