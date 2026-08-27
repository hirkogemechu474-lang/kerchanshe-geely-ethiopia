import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { contentRepository } from '@/repositories/contentRepository';

// GET - List all showcases
export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const showcases = await contentRepository.findAllShowcases();

    return NextResponse.json(showcases);
  } catch (error) {
    console.error('Error fetching showcases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showcases' },
      { status: 500 }
    );
  }
}

// POST - Create new showcase
export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const body = await request.json();

    const showcase = await contentRepository.createShowcase({
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

    return NextResponse.json(showcase, { status: 201 });
  } catch (error) {
    console.error('Error creating showcase:', error);
    return NextResponse.json(
      { error: 'Failed to create showcase' },
      { status: 500 }
    );
  }
}
