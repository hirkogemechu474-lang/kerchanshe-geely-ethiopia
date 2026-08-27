import { NextRequest, NextResponse } from 'next/server';
import { contentRepository } from '@/repositories/contentRepository';
import type { SiteNavPlacement } from '@prisma/client';

export async function GET(request: NextRequest) {
  const placement = request.nextUrl.searchParams.get('placement') as SiteNavPlacement | null;

  const items = await contentRepository.findActiveSiteNavItems(placement);

  return NextResponse.json({ items });
}
