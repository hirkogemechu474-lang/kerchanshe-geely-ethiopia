import { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { BASE_PATH, withBasePathUrl } from '@/lib/basePath';
import apiClient from '@/lib/apiClient';

// Admin-managed extra robots.txt rules (Setting['seo_settings'].robotsExtra,
// edited at /admin/settings/seo) — freeform text, one `Allow:`/`Disallow:`
// directive per line, merged into the wildcard rule below. next-generated
// MetadataRoute.Robots has no "raw appended text" field (Next always
// serializes the structured `rules` array itself), so this is the closest
// faithful equivalent to "append this to robots.txt" without hand-rolling a
// route.ts that emits raw text instead of using the metadata file convention.
async function getExtraRobotsRules(): Promise<{ allow: string[]; disallow: string[] }> {
  const allow: string[] = [];
  const disallow: string[] = [];
  try {
    const { data } = await apiClient.get('/public/seo-settings');
    const raw = typeof data?.robotsExtra === 'string' ? data.robotsExtra : '';
    for (const line of raw.split('\n')) {
      const match = line.match(/^\s*(allow|disallow)\s*:\s*(.+?)\s*$/i);
      if (!match) continue;
      const [, directive, path] = match;
      if (!path) continue;
      (directive.toLowerCase() === 'allow' ? allow : disallow).push(path);
    }
  } catch {
    // Backend unreachable — fall back to just the built-in rules below.
  }
  return { allow, disallow };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = withBasePathUrl(env.app.url);
  const extra = await getExtraRobotsRules();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', ...extra.allow],
        disallow: [
          `${BASE_PATH}/api/`,
          `${BASE_PATH}/admin/`,
          `${BASE_PATH}/_next/`,
          `${BASE_PATH}/private/`,
          '*.json',
          `${BASE_PATH}/sw.js`,
          ...extra.disallow,
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
