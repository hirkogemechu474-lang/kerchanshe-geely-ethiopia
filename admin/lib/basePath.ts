/** The configured mount point for the admin app (empty when served at /). */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

export function withBasePath(path: string): string {
  if (!path || !BASE_PATH || /^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  return path === BASE_PATH || path.startsWith(`${BASE_PATH}/`) ? path : `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}
