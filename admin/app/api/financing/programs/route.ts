import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listPrograms, createProgram } from '@/lib/services/financing/financingService';

// GET programs (admin sees all statuses) — ?bankId=X&vehicleId=Y&status=Z
export async function GET(req: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(req.url);
    const bankId = searchParams.get('bankId') || undefined;
    const vehicleId = searchParams.get('vehicleId') || undefined;
    const status = (searchParams.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | null) || undefined;

    const programs = await listPrograms({ bankId, vehicleId, status });
    return NextResponse.json(programs);
  } catch (error) {
    console.error('[financing-programs:get]', error);
    return NextResponse.json(
      { error: 'Failed to load financing programs', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST create program
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const b = await request.json();
    const result = await createProgram(b);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }
    return NextResponse.json({ success: true, data: result.program });
  } catch (error) {
    console.error('[financing-programs:post]', error);
    return NextResponse.json(
      { error: 'Failed to create financing program', details: (error as Error).message },
      { status: 500 }
    );
  }
}
