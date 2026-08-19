import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET – Fetch all part brands
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brands = await prisma.partBrand.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST – Create a brand
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, imageUrl, description, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const brand = await prisma.partBrand.create({
      data: {
        name,
        imageUrl: imageUrl || null,
        description: description || null,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}