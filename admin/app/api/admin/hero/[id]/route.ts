import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Fetch single hero section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const heroSection = await contentRepository.findHeroSectionById(id);

    if (!heroSection) {
      return NextResponse.json({ error: 'Hero section not found' }, { status: 404 });
    }

    return NextResponse.json({ heroSection });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    return NextResponse.json({ error: 'Failed to fetch hero section' }, { status: 500 });
  }
}

// PUT - Update hero section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const heroSection = await contentRepository.updateHeroSection(id, {
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
    });

    return NextResponse.json({ heroSection });
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json({ error: 'Failed to update hero section' }, { status: 500 });
  }
}

// DELETE - Delete hero section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    await contentRepository.deleteHeroSection(id);

    return NextResponse.json({ success: true, message: 'Hero section deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero section:', error);
    return NextResponse.json({ error: 'Failed to delete hero section' }, { status: 500 });
  }
}
