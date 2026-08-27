import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - Get single showcase
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const showcase = await contentRepository.findShowcaseById(id);

    if (!showcase) {
      return NextResponse.json(
        { error: 'Showcase not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(showcase);
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcase' },
      { status: 500 }
    );
  }
}

// PUT - Update showcase
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    const body = await request.json();

    const showcase = await contentRepository.updateShowcase(id, {
      vehicleId: body.vehicleId,
      vehicleName: body.vehicleName,
      title: body.title,
      subtitle: body.subtitle || null,
      views: body.views || [],
      videoUrl: body.videoUrl || null,
      ctaText: body.ctaText || null,
      ctaLink: body.ctaLink || null,
      sortOrder: body.sortOrder || 0,
      isActive: body.isActive !== undefined ? body.isActive : false,
    });

    return NextResponse.json(showcase);
  } catch (error) {
    console.error('Error updating showcase:', error);
    return NextResponse.json(
      { error: 'Failed to update showcase' },
      { status: 500 }
    );
  }
}

// DELETE - Delete showcase
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const { id } = await params;
  try {
    await contentRepository.deleteShowcase(id);

    return NextResponse.json({ message: 'Showcase deleted successfully' });
  } catch (error) {
    console.error('Error deleting showcase:', error);
    return NextResponse.json(
      { error: 'Failed to delete showcase' },
      { status: 500 }
    );
  }
}
