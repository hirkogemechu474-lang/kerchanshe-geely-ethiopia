// Custom next/image loader — bypasses Next's built-in /_next/image optimizer,
// which cannot resolve local image paths once `basePath` is set (returns
// 400 "not a valid image" for every local /public file). This loader just
// returns the raw file URL with the basePath prepended, which is confirmed
// to resolve correctly. Trade-off: no on-the-fly resize/avif/webp conversion.
//
// The `w`/`q` query params are appended (and ignored by the static file
// server) solely so the URL varies by width/quality — Next warns that a
// loader "does not implement width" if it always returns the same string.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
  const resolved = /^https?:\/\//i.test(src)
    ? src
    : src.startsWith(basePath) ? src : `${basePath}${src}`;
  const separator = resolved.includes("?") ? "&" : "?";
  return `${resolved}${separator}w=${width}&q=${quality ?? 75}`;
}
