import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { mediaAssetRepository } from '@/repositories/mediaAssetRepository';

export type UploadMediaResult =
  | { ok: true; mediaAsset: any }
  | { ok: false; httpStatus: 400; error: string };

export async function uploadMediaAsset(file: File, category: string, altText: string): Promise<UploadMediaResult> {
  // Validate file type
  const fileType = file.type.startsWith('image/') ? 'image' :
                   file.type.startsWith('video/') ? 'video' : null;

  if (!fileType) {
    return { ok: false, httpStatus: 400, error: 'Invalid file type. Only images and videos are allowed.' };
  }

  // Validate file size (50MB max for videos, 10MB for images)
  const maxSize = fileType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { ok: false, httpStatus: 400, error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` };
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
  const thumbnailUrl = null;
  const width = null;
  const height = null;
  const duration = null;

  // If it's an image, you could extract dimensions here with sharp or similar
  // If it's a video, you could extract duration with ffmpeg

  const mediaAsset = await mediaAssetRepository.create({
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
  });

  return { ok: true, mediaAsset };
}
