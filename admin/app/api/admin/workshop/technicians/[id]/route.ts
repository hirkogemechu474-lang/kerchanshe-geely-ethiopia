import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageTechnicians) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, skillLevel, certificationLevel, isActive } = body;

    const technician = await prisma.technician.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(skillLevel !== undefined && { skillLevel }),
        ...(certificationLevel !== undefined && { certificationLevel }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ technician });
  } catch (error) {
    console.error('Error updating technician:', error);
    return NextResponse.json({ error: 'Failed to update technician' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageTechnicians) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    // Soft-deactivate rather than hard-delete: a technician with historical
    // job cards must remain resolvable in JobCard.technician relations.
    const technician = await prisma.technician.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ technician });
  } catch (error) {
    console.error('Error deactivating technician:', error);
    return NextResponse.json({ error: 'Failed to deactivate technician' }, { status: 500 });
  }
}
