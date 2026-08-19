import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/hero
 * Get active hero sections for public display
 */
export async function GET() {
  try {
    const heroSections = await prisma.heroSection.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        mediaType: true,
        imageUrl: true,
        videoUrl: true,
        posterUrl: true,
        buttonText: true,
        buttonLink: true,
        sortOrder: true,
      },
    });

    return NextResponse.json(heroSections);
  } catch (error) {
    console.error('Error fetching hero sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero sections' },
      { status: 500 }
    );
  }
}
