// Prepends NEXT_PUBLIC_BASE_PATH to a root-relative local path (DB-stored
// image/file paths, e.g. "/images/vehicles/x.jpg" or "/uploads/y.png").
// Needed because these values are rendered directly in plain <img src={...}>
// tags — unlike next/image (see lib/imageLoader.ts) or fetch() calls, nothing
// else adds the basePath for them, and since these are Server Components the
// browser parses the wrong URL straight out of the initial HTML — a
// client-side patch cannot fix it after the fact. No-op locally where
// NEXT_PUBLIC_BASE_PATH is unset.
export function withBasePath(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
  if (!basePath || path.startsWith(basePath + "/") || path === basePath) return path;
  return `${basePath}${path}`;
}
