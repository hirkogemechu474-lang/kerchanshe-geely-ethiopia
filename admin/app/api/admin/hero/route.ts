import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Fetch all hero sections
export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const heroSections = await contentRepository.findHeroSections(includeInactive);

    return NextResponse.json({ heroSections });
  } catch (error) {
    console.error('Error fetching hero sections:', error);
    return NextResponse.json({ error: 'Failed to fetch hero sections' }, { status: 500 });
  }
}

// POST - Create new hero section
export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

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

    const heroSection = await contentRepository.createHeroSection({
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
