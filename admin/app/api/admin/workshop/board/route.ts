import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getBoard } from '@/lib/services/workshop/jobCardService';

// Data source for the Bay Scheduling Board (BRD Screen 6): every active bay,
// plus the job cards scheduled against it for the given day.
export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const result = await getBoard(date);

  return NextResponse.json(result);
}
