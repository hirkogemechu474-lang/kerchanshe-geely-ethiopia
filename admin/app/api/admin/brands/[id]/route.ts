import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;
    if (!session!.user.permissions.canViewVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brand = await contentRepository.findBrandById(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;
    if (!session!.user.permissions.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const brand = await contentRepository.updateBrand(id, {
      name: data.name ? String(data.name).trim() : undefined,
      slug: data.slug ? String(data.slug).trim() : data.name ? slugify(String(data.name)) : undefined,
      description: data.description ?? undefined,
      logoUrl: data.logoUrl ?? undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
    });

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Error updating brand:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;
    if (!session!.user.permissions.canManageVehicles) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await contentRepository.deleteBrand(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
