import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getBank, updateBank, deleteBank } from '@/lib/services/financing/financingService';

type Params = Promise<{ id: string }>;

// GET single bank
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const bank = await getBank(id);
    if (!bank) return NextResponse.json({ error: 'Bank not found' }, { status: 404 });
    return NextResponse.json(bank);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load bank', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT/PATCH — Update bank
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  return updateBankRoute(request, params);
}
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  return updateBankRoute(request, params);
}

async function updateBankRoute(request: NextRequest, params: Params) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateBank(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[financing-banks:update]', error);
    return NextResponse.json(
      { error: 'Failed to update bank', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE bank
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    await deleteBank(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[financing-banks:delete]', error);
    return NextResponse.json(
      { error: 'Failed to delete bank (a program may still reference it)', details: (error as Error).message },
      { status: 500 }
    );
  }
}
