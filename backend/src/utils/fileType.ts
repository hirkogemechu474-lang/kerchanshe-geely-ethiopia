import { extname } from 'path';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

export function isImageFile(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(extname(filename).toLowerCase());
}

export function isVideoFile(filename: string): boolean {
  return VIDEO_EXTENSIONS.includes(extname(filename).toLowerCase());
}

export function isDocumentFile(filename: string): boolean {
  return DOCUMENT_EXTENSIONS.includes(extname(filename).toLowerCase());
}

export function isPdfUrl(url: string): boolean {
  return url?.toLowerCase().endsWith('.pdf') || false;
}

export function resolveDocumentUrl(url: string, baseUrl?: string): string {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  if (baseUrl) return `${baseUrl}${url}`;
  return url;
}

export function getFileCategory(filename: string): 'image' | 'video' | 'document' | 'unknown' {
  if (isImageFile(filename)) return 'image';
  if (isVideoFile(filename)) return 'video';
  if (isDocumentFile(filename)) return 'document';
  return 'unknown';
}
