import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageContent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { label, subtitle, icon, href, openInNewTab, isHighlighted, isActive, displayOrder } = body;

    const item = await contentRepository.updateSiteNavItem(id, {
      ...(label !== undefined && { label }),
      ...(subtitle !== undefined && { subtitle: subtitle || null }),
      ...(icon !== undefined && { icon: icon || null }),
      ...(href !== undefined && { href }),
      ...(openInNewTab !== undefined && { openInNewTab: Boolean(openInNewTab) }),
      ...(isHighlighted !== undefined && { isHighlighted: Boolean(isHighlighted) }),
      ...(isActive !== undefined && { isActive }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating site nav item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageContent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    await contentRepository.deleteSiteNavItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting site nav item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
