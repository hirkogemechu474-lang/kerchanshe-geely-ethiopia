import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageBays) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, bayType, status, isActive } = body;

    const bay = await prisma.serviceBay.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(bayType !== undefined && { bayType }),
        ...(status !== undefined && { status }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ bay });
  } catch (error) {
    console.error('Error updating bay:', error);
    return NextResponse.json({ error: 'Failed to update bay' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageBays) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const bay = await prisma.serviceBay.update({
      where: { id },
      data: { isActive: false, status: 'OUT_OF_SERVICE' },
    });

    return NextResponse.json({ bay });
  } catch (error) {
    console.error('Error deactivating bay:', error);
    return NextResponse.json({ error: 'Failed to deactivate bay' }, { status: 500 });
  }
}
