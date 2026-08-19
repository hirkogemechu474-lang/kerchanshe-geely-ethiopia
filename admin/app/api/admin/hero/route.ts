import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch all hero sections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where = includeInactive ? {} : { isActive: true };

    const heroSections = await prisma.heroSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ heroSections });
  } catch (error) {
    console.error('Error fetching hero sections:', error);
    return NextResponse.json({ error: 'Failed to fetch hero sections' }, { status: 500 });
  } 
}

// POST - Create new hero section
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      description,
      mediaType,
      imageUrl,
      videoUrl,
      posterUrl,
      buttonText,
      buttonLink,
      sortOrder,
      isActive,
      status,
    } = body;

    if (!title || !mediaType) {
      return NextResponse.json(
        { error: 'Title and media type are required' },
        { status: 400 }
      );
    }

    if (mediaType === 'IMAGE' && !imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required for image type' },
        { status: 400 }
      );
    }

    if (mediaType === 'VIDEO' && !videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required for video type' },
        { status: 400 }
      );
    }

    const heroSection = await prisma.heroSection.create({
      data: {
        title,
        subtitle,
        description,
        mediaType,
        imageUrl,
        videoUrl,
        posterUrl,
        buttonText,
        buttonLink,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? false,
        status: status || 'draft',
      },
    });

    return NextResponse.json({ heroSection }, { status: 201 });
  } catch (error) {
    console.error('Error creating hero section:', error);
    return NextResponse.json(
      { error: 'Failed to create hero section' },
      { status: 500 }
    );
  } 
}
