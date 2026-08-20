import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

/**
 * GET /api/media
 * Get all media assets with optional filters
 */
export async function GET(request: Request) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const fileType = searchParams.get('fileType');
    const category = searchParams.get('category');

    const where: any = {};
    
    if (fileType) {
      where.fileType = fileType;
    }
    
    if (category) {
      where.category = category;
    }

    const mediaAssets = await prisma.mediaAsset.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(mediaAssets);
  } catch (error) {
    console.error('Error fetching media assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media assets' },
      { status: 500 }
    );
  }
}
