import { NextResponse } from 'next/server';
import { uploadMediaAsset } from '@/lib/services/media/mediaService';

/**
 * POST /api/upload
 * Upload media files (images/videos) and save to MediaAsset
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';
    const altText = formData.get('altText') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const result = await uploadMediaAsset(file, category, altText);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({
      success: true,
      file: result.mediaAsset,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
