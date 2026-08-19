import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

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

    // Validate file type
    const fileType = file.type.startsWith('image/') ? 'image' : 
                     file.type.startsWith('video/') ? 'video' : null;

    if (!fileType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (50MB max for videos, 10MB for images)
    const maxSize = fileType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileName = `${sanitizedName}-${timestamp}${ext}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', category);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate URL
    const url = `/uploads/${category}/${fileName}`;

    // For videos, we might want to generate a thumbnail in the future
    // For now, we'll just store the video URL
    let thumbnailUrl = null;
    let width = null;
    let height = null;
    let duration = null;

    // If it's an image, you could extract dimensions here with sharp or similar
    // If it's a video, you could extract duration with ffmpeg

    // Save to database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        fileName,
        originalName,
        fileType,
        mimeType: file.type,
        fileSize: file.size,
        url,
        thumbnailUrl,
        width,
        height,
        duration,
        altText: altText || originalName,
        category,
        isPublic: true,
      },
    });

    return NextResponse.json({
      success: true,
      file: mediaAsset,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
