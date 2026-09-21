const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

export { BASE_PATH };

export function withBasePath(path: string): string {
  if (!path || !BASE_PATH) return path;
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

export function withBasePathUrl(url: string): string {
  if (!url || !BASE_PATH) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${BASE_PATH}${url}`;
  }
  return withBasePath(url);
}

export function stripBasePath(path: string): string {
  if (!path || !BASE_PATH || !path.startsWith(BASE_PATH)) return path;
  return path.slice(BASE_PATH.length) || '/';
}
