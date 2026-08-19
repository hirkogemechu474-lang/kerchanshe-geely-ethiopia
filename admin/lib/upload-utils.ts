import path from 'path';

export const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

/**
 * Restrict a client-supplied upload category to a safe folder name.
 * Blocks path traversal such as `../../`, absolute paths, and encoded separators.
 */
export function sanitizeCategory(
  category: string | undefined | null,
  fallback = 'general'
): string {
  const cleaned = (category ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
  return cleaned || fallback;
}

/**
 * True only when `target` resolves to a path strictly inside the uploads root.
 * Must be applied AFTER path resolution (never trust a raw client string).
 */
export function isInsideUploads(target: string): boolean {
  const resolved = path.resolve(target);
  const root = path.resolve(UPLOADS_ROOT);
  return resolved === root || resolved.startsWith(root + path.sep);
}

/**
 * Resolve a public `/uploads/...` URL to an absolute filesystem path.
 * Returns null when the URL is not a valid `/uploads/` path or escapes the
 * uploads root.
 */
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
