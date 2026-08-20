import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;
    if (!session!.user.permissions.canViewVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brand = await prisma.vehicleBrand.findUnique({
      where: { id: id },
      include: {
        categories: true,
        vehicles: {
          take: 10,
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
        _count: {
          select: {
            vehicles: true,
            categories: true,
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error fetching brand:', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;
    if (!session!.user.permissions.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const brand = await prisma.vehicleBrand.update({
      where: { id: id },
      data: {
        name: data.name ? String(data.name).trim() : undefined,
        slug: data.slug ? String(data.slug).trim() : data.name ? slugify(String(data.name)) : undefined,
        description: data.description ?? undefined,
        logoUrl: data.logoUrl ?? undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
      },
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;
    if (!session!.user.permissions.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.vehicleBrand.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
