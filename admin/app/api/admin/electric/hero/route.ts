import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch hero section
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hero = await prisma.electricPage.findFirst({
      where: { slug: 'hero' },
    });

    if (!hero) {
      return NextResponse.json({ error: 'Hero section not found' }, { status: 404 });
    }

    return NextResponse.json({ hero });
  } catch (error) {
    console.error('Error fetching hero:', error);
    return NextResponse.json({ error: 'Failed to fetch hero section' }, { status: 500 });
  } 
}

// POST - Create hero section
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const hero = await prisma.electricPage.create({
      data: {
        title: 'Electric Hero Section',
        slug: 'hero',
        pageType: 'custom',
        heroTitle: body.heroTitle,
        heroSubtitle: body.heroSubtitle,
        heroImage: body.heroImage,
        content: body.heroDescription,
        metadata: {
          ctaButtonText: body.ctaButtonText,
          ctaButtonLink: body.ctaButtonLink,
          ctaSecondaryButtonText: body.ctaSecondaryButtonText,
          ctaSecondaryButtonLink: body.ctaSecondaryButtonLink,
          backgroundGradient: body.backgroundGradient,
          heroVideo: body.heroVideo,
        },
        isPublished: body.isPublished ?? true,
        displayOrder: 0,
      },
    });

    return NextResponse.json({ hero }, { status: 201 });
  } catch (error) {
    console.error('Error creating hero:', error);
    return NextResponse.json(
      { error: 'Failed to create hero section' },
      { status: 500 }
    );
  } 
}
