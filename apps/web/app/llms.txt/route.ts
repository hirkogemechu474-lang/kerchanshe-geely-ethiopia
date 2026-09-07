import { env } from '@/lib/env';
import { withBasePathUrl } from '@/lib/basePath';

// llms.txt (llmstxt.org) — a plain-language map of the site for LLM agents,
// separate from robots.txt (crawler permissions) and sitemap.xml (URL list
// for search engines). Static text, revalidated occasionally in case routes
// change.
export const revalidate = 3600;

export async function GET() {
  const baseUrl = withBasePathUrl(env.app.url);

  const body = `# Geely Ethiopia

> Official Geely vehicle distributor site for Ethiopia, operated by Kerchanshe Group. Browse models, configure and compare vehicles, request quotes, book service, and manage orders.

## Key pages

- [Models](${baseUrl}/models): Full Geely model lineup available in Ethiopia
- [Compare](${baseUrl}/compare): Side-by-side vehicle comparison
- [Configurator](${baseUrl}/configurator): Build and price a vehicle
- [Financing](${baseUrl}/financing): Financing options and application
- [Service](${baseUrl}/service): Service booking and workshop information
- [FAQ](${baseUrl}/faq): Frequently asked questions
- [Sitemap](${baseUrl}/sitemap.xml): Full list of indexable URLs

## Notes

- Pricing, inventory, and promotions change frequently — treat any cached figures as indicative and confirm on the live pages.
- Account, order, and admin areas require authentication and are not part of the public content set.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
