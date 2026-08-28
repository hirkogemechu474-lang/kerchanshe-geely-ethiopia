import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sanitizeCategory, UPLOADS_ROOT } from '@/lib/upload-utils';
import { mediaAssetRepository } from '@/repositories/mediaAssetRepository';

/**
 * POST /api/upload
 * Upload media files (images/videos) and save to MediaAsset.
 * Admin-only.
 */
export async function POST(request: Request) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = sanitizeCategory(formData.get('category') as string | null);
    const altText = (formData.get('altText') as string | null) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const extension = path.extname(file.name).toLowerCase();
    // SVG intentionally excluded: inline SVG can carry executable script.
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
    const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v'];

    const fileType =
      file.type.startsWith('image/') || imageExtensions.includes(extension)
        ? 'image'
        : file.type.startsWith('video/') || videoExtensions.includes(extension)
          ? 'video'
          : null;

    if (!fileType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = fileType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const ext = extension;
    const nameWithoutExt = path.basename(file.name, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${sanitizedName}-${timestamp}${ext}`;

    const uploadDir = path.join(UPLOADS_ROOT, category);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/${category}/${fileName}`;

    const mediaAsset = await mediaAssetRepository.create({
      fileName,
      originalName: file.name,
      fileType,
      mimeType: file.type || (fileType === 'image' ? 'image/jpeg' : 'video/mp4'),
      fileSize: file.size,
      url,
      thumbnailUrl: null,
      width: null,
      height: null,
      duration: null,
      altText: altText || file.name,
      category,
      isPublic: true,
    });

    return NextResponse.json({ success: true, file: mediaAsset });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
