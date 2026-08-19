import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

// PUT – Update a benefit
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const benefit = await prisma.partBenefit.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.icon !== undefined && { icon: body.icon }),
        ...(body.displayOrder !== undefined && { displayOrder: parseInt(body.displayOrder) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({ benefit });
  } catch (error) {
    console.error('Error updating benefit:', error);
    return NextResponse.json({ error: 'Failed to update benefit' }, { status: 500 });
  }
}

// DELETE – Delete a benefit
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.partBenefit.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Benefit deleted' });
  } catch (error) {
    console.error('Error deleting benefit:', error);
    return NextResponse.json({ error: 'Failed to delete benefit' }, { status: 500 });
  }
}