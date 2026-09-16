'use client';

// Single shared path for turning a File into a browsable Media Library entry.
// /api/upload only writes the file to disk and returns a URL — it does not
// touch the database, so anything that stops after that call is invisible to
// MediaBrowser (which lists rows from /api/media, i.e. the MediaAsset table).
// Every uploader in the admin app should go through this function instead of
// calling /api/upload directly, so uploads always show up in the library.

export interface MediaAssetRecord {
  id?: string;
  fileName: string;
  originalName: string;
  fileType: 'image' | 'video';
  mimeType: string;
  fileSize: number;
  url: string;
  altText?: string;
  category: string;
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.m4v'];

export function inferMediaFileType(file: File): 'image' | 'video' {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const isVideo = file.type.startsWith('video/') || VIDEO_EXTENSIONS.includes(extension);
  return isVideo ? 'video' : 'image';
}

export async function uploadAndRegisterMedia(
  file: File,
  opts: { category: string; altText?: string }
): Promise<MediaAssetRecord> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', opts.category);
  formData.append('altText', opts.altText ?? file.name);

  const uploadResponse = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.json().catch(() => ({}));
    throw new Error(errorBody.error || errorBody.details || `Upload failed (${uploadResponse.status})`);
  }

  const { url } = await uploadResponse.json();
  if (!url) {
    throw new Error('Upload completed but the server did not return a media URL.');
  }

  const asset: MediaAssetRecord = {
    fileName: url.split('/').pop() || file.name,
    originalName: file.name,
    fileType: inferMediaFileType(file),
    mimeType: file.type,
    fileSize: file.size,
    url,
    altText: opts.altText ?? file.name,
    category: opts.category,
  };

  try {
    const registerResponse = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asset),
    });
    if (registerResponse.ok) {
      return await registerResponse.json();
    }
    console.error('File uploaded but could not be registered in the media library.');
  } catch (error) {
    console.error('Error registering media asset:', error);
  }

  // The file is already on disk and usable even if the library registration
  // failed — don't make the caller lose the upload over a bookkeeping error.
  return asset;
}
