import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET – Fetch all part benefits
export async function GET() {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const benefits = await prisma.partBenefit.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return NextResponse.json({ error: 'Failed to fetch benefits' }, { status: 500 });
  }
}

// POST – Create a benefit
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const { title, description, icon, displayOrder, isActive } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const benefit = await prisma.partBenefit.create({
      data: {
        title,
        description: description || null,
        icon: icon || null,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ benefit }, { status: 201 });
  } catch (error) {
    console.error('Error creating benefit:', error);
    return NextResponse.json({ error: 'Failed to create benefit' }, { status: 500 });
  }
}