import { MetadataRoute } from 'next';
import { serverApiClient } from '@/lib/serverApiClient';
import { env } from '@/lib/env';
import { withBasePathUrl } from '@/lib/basePath';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

const BASE_URL = withBasePathUrl(env.app.url);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ─── Static pages ──────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/models`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE_URL}/dealers`,       lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/compare`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/configurator`,  lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/configure`,     lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/financing`,     lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/test-drive`,    lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/quote`,         lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${BASE_URL}/news`,          lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/offers`,        lastModified: now, changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE_URL}/parts`,         lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/service`,       lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`,         lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/developer`,     lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/faq`,           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/warranty`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/reviews`,       lastModified: now, changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE_URL}/roadside`,      lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/trade-in`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/terms`,         lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${BASE_URL}/cookies`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ];

  const client = await serverApiClient();

  // ─── Dynamic vehicle pages ────────────────────────────────────────────────
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const { data: vehicles } = await client.get('/public/vehicles');
    vehiclePages = (Array.isArray(vehicles) ? vehicles : [])
      .filter((v: any) => v.isActive && v.status === 'published')
      .flatMap((v: any) => [
        {
          url: `${BASE_URL}/models/${v.slug}`,
          lastModified: v.updatedAt || now,
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        },
        {
          url: `${BASE_URL}/models/${v.slug}?lang=am`,
          lastModified: v.updatedAt || now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ]);
  } catch (err) {
    console.error('[sitemap] Failed to fetch vehicles:', err);
  }

  // ─── Dynamic dealer pages ─────────────────────────────────────────────────
  let dealerPages: MetadataRoute.Sitemap = [];
  try {
    const { data: dealers } = await client.get('/public/dealers');
    dealerPages = (Array.isArray(dealers) ? dealers : []).map((d: any) => ({
      url: `${BASE_URL}/dealers/${d.id}`,
      lastModified: d.updatedAt || now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error('[sitemap] Failed to fetch dealers:', err);
  }

  // ─── Dynamic news pages ───────────────────────────────────────────────────
  let newsPages: MetadataRoute.Sitemap = [];
  try {
    const { data: newsResponse } = await client.get('/public/news', { params: { pageSize: 500 } });
    const articles = Array.isArray(newsResponse?.items) ? newsResponse.items : [];
    newsPages = articles.map((a: any) => ({
      url: `${BASE_URL}/news/${a.id}`,
      lastModified: a.publishDate || now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error('[sitemap] Failed to fetch news:', err);
  }

  // ─── Dynamic offers/promotions pages ──────────────────────────────────────
  let offerPages: MetadataRoute.Sitemap = [];
  try {
    const { data: promotions } = await client.get('/public/promotions');
    offerPages = (Array.isArray(promotions) ? promotions : []).map((p: any) => ({
      url: `${BASE_URL}/offers/${p.id}`,
      lastModified: p.updatedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.warn('[sitemap] Could not fetch promotions:', err);
  }

  return [
    ...staticPages,
    ...vehiclePages,
    ...dealerPages,
    ...newsPages,
    ...offerPages,
  ];
}
