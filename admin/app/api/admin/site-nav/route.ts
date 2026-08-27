import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';
import type { SiteNavPlacement } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const placement = request.nextUrl.searchParams.get('placement') as SiteNavPlacement | null;

  const items = await contentRepository.findSiteNavItems(placement);

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageContent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { placement, label, subtitle, icon, href, openInNewTab, isHighlighted, isActive, displayOrder } = body;

    if (!placement || !label || !href) {
      return NextResponse.json({ error: 'placement, label, and href are required' }, { status: 400 });
    }

    const item = await contentRepository.createSiteNavItem({
      placement,
      label,
      subtitle: subtitle || null,
      icon: icon || null,
      href,
      openInNewTab: Boolean(openInNewTab),
      isHighlighted: Boolean(isHighlighted),
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating site nav item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
