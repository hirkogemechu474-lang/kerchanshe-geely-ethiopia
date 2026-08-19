import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const technicians = await prisma.technician.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { jobCards: true } } },
  });

  return NextResponse.json({ technicians });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageTechnicians) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, phone, skillLevel, certificationLevel } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const technician = await prisma.technician.create({
      data: {
        name,
        phone: phone || null,
        skillLevel: skillLevel || 'JUNIOR',
        certificationLevel: certificationLevel || null,
      },
    });

    return NextResponse.json({ technician }, { status: 201 });
  } catch (error) {
    console.error('Error creating technician:', error);
    return NextResponse.json({ error: 'Failed to create technician' }, { status: 500 });
  }
}
