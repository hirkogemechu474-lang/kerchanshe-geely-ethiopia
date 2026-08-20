import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { SiteNavPlacement } from '@prisma/client';

export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get('placement') as SiteNavPlacement | null;

  const items = await prisma.siteNavItem.findMany({
    where: { isActive: true, ...(placement ? { placement } : {}) },
    orderBy: { displayOrder: 'asc' },
  });

  return NextResponse.json({ items });
}
