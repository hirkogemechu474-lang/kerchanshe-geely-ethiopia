import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listBanks, createBank } from '@/lib/services/financing/financingService';

// GET /api/financing/banks
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const banks = await listBanks();
    return NextResponse.json(banks);
  } catch (error) {
    console.error('[financing-banks:get]', error);
    return NextResponse.json(
      { error: 'Failed to load financing banks', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/financing/banks — Create new bank
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();
    const result = await createBank(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }
    return NextResponse.json({ success: true, data: result.bank });
  } catch (error) {
    console.error('[financing-banks:post]', error);
    return NextResponse.json(
      { error: 'Failed to create financing bank', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH /api/financing/banks/[id]
// PUT /api/financing/banks/[id]
// DELETE /api/financing/banks/[id]
