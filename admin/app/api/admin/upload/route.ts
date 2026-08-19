import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const ALLOWED_EXTENSIONS = {
  image: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'],
  video: ['.mp4', '.webm', '.mov', '.avi'],
  pdf: ['.pdf'],
};

const ALLOWED_MIME = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'application/pdf',
];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const isImage = ALLOWED_EXTENSIONS.image.includes(ext);
    const isVideo = ALLOWED_EXTENSIONS.video.includes(ext);
    const isPdf = ALLOWED_EXTENSIONS.pdf.includes(ext);

    if (!isImage && !isVideo && !isPdf) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP, SVG, GIF, MP4, WEBM, MOV, AVI, PDF.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB images, 50MB videos, 15MB PDF)
    const maxSize = isVideo ? 50 * 1024 * 1024 : isPdf ? 15 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const label = isVideo ? '50MB' : isPdf ? '15MB' : '10MB';
      return NextResponse.json(
        { error: `File too large. Maximum size is ${label}.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomString}${ext}`;

    await writeFile(path.join(uploadDir, filename), buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}