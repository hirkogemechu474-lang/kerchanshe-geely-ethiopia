import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getProgram, updateProgram, deleteProgram } from '@/lib/services/financing/financingService';

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const p = await getProgram(id);
    if (!p) return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    return NextResponse.json(p);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load program', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const b = await request.json();
    const updated = await updateProgram(id, b);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[financing-program:update]', error);
    return NextResponse.json(
      { error: 'Failed to update program', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Params }) {
  return PUT(req, ctx);
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    await deleteProgram(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete program', details: (error as Error).message },
      { status: 500 }
    );
  }
}
