import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { adminApi } from '@/services/adminApiClient';
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

  // ─── Dynamic vehicle pages (from DB or API) ──────────────────────────────────
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true, status: 'published' },
      select: { slug: true, updatedAt: true },
      orderBy: { displayOrder: 'asc' },
    });

    if (vehicles.length > 0) {
      vehiclePages = vehicles.flatMap(({ slug, updatedAt }: { slug: string; updatedAt: Date }) => [
        {
          url: `${BASE_URL}/models/${slug}`,
          lastModified: updatedAt.toISOString(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        },
        {
          url: `${BASE_URL}/models/${slug}?lang=am`,
          lastModified: updatedAt.toISOString(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ]);
    } else {
      throw new Error('Prisma returned no vehicles, trying adminApi fallback');
    }
  } catch (err) {
    console.warn('[sitemap] Prisma vehicle fetch failed, using adminApi fallback:', err);
    try {
      const res = await adminApi.vehicles.list();
      const list = Array.isArray(res) ? res : res?.vehicles || [];
      vehiclePages = list.flatMap((v: any) => [
        {
          url: `${BASE_URL}/models/${v.slug || v.id}`,
          lastModified: v.updatedAt ? new Date(v.updatedAt).toISOString() : now,
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        },
        {
          url: `${BASE_URL}/models/${v.slug || v.id}?lang=am`,
          lastModified: v.updatedAt ? new Date(v.updatedAt).toISOString() : now,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        },
      ]);
    } catch (apiErr) {
      console.error('[sitemap] Failed to fetch vehicles via adminApi:', apiErr);
    }
  }

  // ─── Dynamic dealer pages (from DB or API) ───────────────────────────────────
  let dealerPages: MetadataRoute.Sitemap = [];
  try {
    const dealers = await prisma.dealer.findMany({
      where: { active: true },
      select: { id: true, updatedAt: true },
    });

    if (dealers.length > 0) {
      dealerPages = dealers.map(({ id, updatedAt }) => ({
        url: `${BASE_URL}/dealers/${id}`,
        lastModified: updatedAt.toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    } else {
      throw new Error('Prisma returned no dealers, trying adminApi fallback');
    }
  } catch (err) {
    console.warn('[sitemap] Prisma dealer fetch failed, using adminApi fallback:', err);
    try {
      const dealers = await adminApi.dealers.list();
      if (Array.isArray(dealers)) {
        dealerPages = dealers.map((d: any) => ({
          url: `${BASE_URL}/dealers/${d.slug || d.id}`,
          lastModified: d.updatedAt ? new Date(d.updatedAt).toISOString() : now,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }));
      }
    } catch (apiErr) {
      console.error('[sitemap] Failed to fetch dealers via adminApi:', apiErr);
    }
  }

  // ─── Dynamic news pages (from DB or API) ─────────────────────────────────────
  let newsPages: MetadataRoute.Sitemap = [];
  try {
    const articles = await prisma.newsArticle.findMany({
      where: { status: 'published' },
      select: { id: true, updatedAt: true },
      orderBy: { publishDate: 'desc' },
    });

    if (articles.length > 0) {
      newsPages = articles.map(({ id, updatedAt }) => ({
        url: `${BASE_URL}/news/${id}`,
        lastModified: updatedAt.toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    } else {
      throw new Error('Prisma returned no news articles, trying adminApi fallback');
    }
  } catch (err) {
    console.warn('[sitemap] Prisma news fetch failed, using adminApi fallback:', err);
    try {
      const articles = await adminApi.news.list();
      if (Array.isArray(articles)) {
        newsPages = articles.map((a: any) => ({
          url: `${BASE_URL}/news/${a.slug || a.id}`,
          lastModified: a.updatedAt ? new Date(a.updatedAt).toISOString() : now,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }));
      }
    } catch (apiErr) {
      console.error('[sitemap] Failed to fetch news via adminApi:', apiErr);
    }
  }

  // ─── Dynamic offers/promotions pages (from DB) ────────────────────────────
  let offerPages: MetadataRoute.Sitemap = [];
  try {
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    });

    offerPages = promotions.map(({ id, updatedAt }) => ({
      url: `${BASE_URL}/offers/${id}`,
      lastModified: updatedAt.toISOString(),
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
