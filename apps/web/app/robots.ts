import { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { BASE_PATH, withBasePathUrl } from '@/lib/basePath';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = withBasePathUrl(env.app.url);

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          `${BASE_PATH}/api/`,
          `${BASE_PATH}/admin/`,
          `${BASE_PATH}/_next/`,
          `${BASE_PATH}/private/`,
          '*.json',
          `${BASE_PATH}/sw.js`,
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
