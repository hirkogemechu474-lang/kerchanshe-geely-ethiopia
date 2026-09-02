/** The configured mount point for the web app (empty when served at /). */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

export function withBasePath(path: string): string {
  if (!path || !BASE_PATH || /^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return path === BASE_PATH || path.startsWith(`${BASE_PATH}/`) ? path : `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

export function withBasePathUrl(url: string): string {
  if (!BASE_PATH) return url;
  try {
    const parsed = new URL(url);
    parsed.pathname = withBasePath(parsed.pathname);
    return parsed.toString().replace(/\/$/, '') || parsed.toString();
  } catch {
    return withBasePath(url);
  }
}
