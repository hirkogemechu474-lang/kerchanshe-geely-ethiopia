import { withBasePath } from './basePath';

// Best-effort nudge to the public web app's homepage ISR cache (see
// apps/web/app/api/revalidate/route.ts) after a hero section, vehicle or
// showcase is created/updated/deleted, so the change shows up without
// waiting out the homepage's normal 60s revalidate window. Never throws —
// a failed revalidation just means the change appears on the next natural
// ISR cycle instead of immediately, not a broken save.
export async function revalidateHomepage() {
  const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET;
  if (!secret) return;
  try {
    // A plain '/api/revalidate' resolves against the browser's origin
    // ROOT, not this app's own basePath — on
    // https://portal.kerchanshe.co/geely/admin/... that hit
    // https://.../api/revalidate (outside the "/geely" prefix Apache
    // proxies to either app entirely). withBasePath produces
    // "/geely/api/revalidate", which Apache's "/geely" rule routes to the
    // public web app — the one that actually owns this route.
    await fetch(withBasePath('/api/revalidate'), {
      method: 'POST',
      headers: { 'x-revalidate-secret': secret },
    });
  } catch {
    // Best-effort only.
  }
}
