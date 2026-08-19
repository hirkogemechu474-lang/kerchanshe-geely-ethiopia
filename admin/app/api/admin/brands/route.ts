import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions.canViewVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brands = await prisma.vehicleBrand.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            vehicles: true,
            categories: true,
          },
        },
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.permissions.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const name = String(data.name || '').trim();

    if (!name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const brand = await prisma.vehicleBrand.create({
      data: {
        name,
        slug: data.slug ? String(data.slug).trim() : slugify(name),
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        displayOrder: Number(data.displayOrder || 0),
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
