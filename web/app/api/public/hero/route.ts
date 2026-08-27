import { NextResponse } from 'next/server';
import { contentRepository } from '@/repositories/contentRepository';

/**
 * GET /api/public/hero
 * Get active hero sections for public display
 */
export async function GET() {
  try {
    const heroSections = await contentRepository.findActiveHeroSections();
    return NextResponse.json(heroSections);
  } catch (error) {
    console.error('Error fetching hero sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero sections' },
      { status: 500 }
    );
  }
}
