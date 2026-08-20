import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80) || Math.random().toString(36).slice(2, 10);
}

type Params = Promise<{ id: string }>;

// GET single bank
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const bank = await prisma.financingBank.findUnique({ where: { id } });
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
  return updateBank(request, params, false);
}
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  return updateBank(request, params, false);
}

async function updateBank(request: NextRequest, params: Params, _partial: boolean) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { id } = await params;
    const body = await request.json();
    const fields: string[] = [
      'name', 'slug', 'logoUrl', 'websiteUrl', 'phoneNumber',
      'email', 'branchAddress', 'shortDescription', 'isActive', 'displayOrder',
    ];
    const data: Record<string, unknown> = {};
    fields.forEach(f => {
      if (body[f] !== undefined) data[f] = body[f];
    });
    if (typeof data.name === 'string') data.name = data.name.trim();
    if (typeof data.slug === 'string') data.slug = slugify(data.slug.trim() || data.name as string);
    if (data.isActive !== undefined) data.isActive = !!data.isActive;
    if (data.displayOrder !== undefined) data.displayOrder = Number(data.displayOrder) || 0;

    const updated = await prisma.financingBank.update({ where: { id }, data });
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
    await prisma.financingBank.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[financing-banks:delete]', error);
    return NextResponse.json(
      { error: 'Failed to delete bank (a program may still reference it)', details: (error as Error).message },
      { status: 500 }
    );
  }
}
