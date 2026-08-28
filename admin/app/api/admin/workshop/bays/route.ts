import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listBays, createBay } from '@/lib/services/workshop/bayService';

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const bays = await listBays();

  return NextResponse.json({ bays });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageBays) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const result = await createBay(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ bay: result.bay }, { status: 201 });
}
