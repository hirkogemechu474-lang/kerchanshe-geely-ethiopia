import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const bays = await prisma.serviceBay.findMany({
    orderBy: [{ bayType: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json({ bays });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageBays) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, bayType } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const bay = await prisma.serviceBay.create({
      data: { name, bayType: bayType || 'GENERAL' },
    });

    return NextResponse.json({ bay }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A bay with this name already exists' }, { status: 409 });
    }
    console.error('Error creating bay:', error);
    return NextResponse.json({ error: 'Failed to create bay' }, { status: 500 });
  }
}
