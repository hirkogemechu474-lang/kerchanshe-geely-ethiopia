import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAdminApiSession } from '@/lib/auth/api';
import { sanitizeCategory, resolveUploadUrl, UPLOADS_ROOT } from '@/lib/upload-utils';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = sanitizeCategory(formData.get('category') as string | null);

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(UPLOADS_ROOT, category);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const publicUrl = `/uploads/${category}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const filepath = resolveUploadUrl(url);
    if (!filepath) {
      return NextResponse.json(
        { error: 'Invalid file URL' },
        { status: 400 }
      );
    }

    if (existsSync(filepath)) {
      await unlink(filepath);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
