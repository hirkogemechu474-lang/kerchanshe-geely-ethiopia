import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

interface Params {
  id: string;
}

// GET - Fetch single hero section
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hero = await prisma.electricPage.findUnique({
      where: { id: params.id },
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

// PUT - Update hero section
export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const hero = await prisma.electricPage.update({
      where: { id: params.id },
      data: {
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
        isPublished: body.isPublished,
      },
    });

    return NextResponse.json({ hero });
  } catch (error) {
    console.error('Error updating hero:', error);
    return NextResponse.json({ error: 'Failed to update hero section' }, { status: 500 });
  } 
}
