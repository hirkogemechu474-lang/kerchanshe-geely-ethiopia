import path from 'path';

export const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

export function sanitizeCategory(
  category: string | undefined | null,
  fallback = 'general'
): string {
  const cleaned = (category ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return cleaned || fallback;
}

export function isInsideUploads(target: string): boolean {
  const resolved = path.resolve(target);
  const root = path.resolve(UPLOADS_ROOT);
  return resolved === root || resolved.startsWith(root + path.sep);
}

export function resolveUploadUrl(url: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return null;
  }

  if (!decoded.startsWith('/uploads/')) return null;

  const filePath = path.join(UPLOADS_ROOT, decoded.replace(/^\/uploads\//, ''));
  return isInsideUploads(filePath) ? filePath : null;
}
