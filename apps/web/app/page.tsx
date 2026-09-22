import { MainLayout } from "@/components/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import ModelsShowcase from "@/components/home/ModelsShowcase";
import SpotlightStrip from "@/components/home/SpotlightStrip";
import dynamic from "next/dynamic";
import PromotionsBanner from "@/components/home/PromotionsBanner";
import FinancingSection from "@/components/home/FinancingSection";
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/schema";
import { publicApiClient } from "@/lib/serverApiClient";
import { withBasePathUrl } from "@/lib/basePath";
import { env } from "@/lib/env";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

// The real deployed origin (NEXT_PUBLIC_SITE_URL, e.g.
// https://portal.kerchanshe.co/geely in production) — matches the
// canonical/OG URL convention already used by app/layout.tsx, sitemap.ts
// and robots.ts, instead of a different, unrelated domain.
const BASE_URL = withBasePathUrl(env.app.url);

// Local (/images/...) URLs come from admin-entered content and sometimes
// point at files nobody uploaded, which used to surface as 404s on every
// page load. Since this only runs at ISR regeneration time (revalidate below),
// a sync fs check here is cheap and avoids shipping dead <img>/<Image> src.
function existingLocalImage(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("/images/")) return url;
  return fs.existsSync(path.join(process.cwd(), "public", url)) ? url : null;
}

// Revalidate periodically so hero banner edits made in the admin panel show up
// without a full rebuild, while still serving the fast prerendered HTML.
export const revalidate = 60;

// Keep the above-the-fold path small. These sections retain SSR markup but
// their interactive client code is loaded in separate chunks as needed.
const AboutSection = dynamic(() => import("@/components/home/AboutSection"), { ssr: true });
const StatisticsSection = dynamic(() => import("@/components/home/StatisticsSection"), { ssr: true });
const ShowcaseSection = dynamic(() => import("@/components/home/ShowcaseSection"), { ssr: true });
const CTAStrip = dynamic(() => import("@/components/home/CTAStrip"), { ssr: true });
const TrustSection = dynamic(() => import("@/components/home/TrustSection"), { ssr: true });
const DealerLocatorPreview = dynamic(() => import("@/components/home/DealerLocatorPreview"), { ssr: true });
const CustomerReviews = dynamic(() => import("@/components/home/CustomerReviews"), { ssr: true });
const FAQSection = dynamic(() => import("@/components/home/FAQSection"), { ssr: true });
const NewsSection = dynamic(() => import("@/components/home/NewsSection"), { ssr: true });

const DEFAULT_STATS = [
  { label: 'Vehicles Sold', value: '10,000+' },
  { label: 'Happy Customers', value: '8,500+' },
  { label: 'Service Centers', value: '15+' },
  { label: 'Years of Excellence', value: '5+' },
];

export const metadata: Metadata = {
  title: "Geely Ethiopia | Official Distributor by Kerchanshe Group Geely",
  description:
    "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads. Official distributor with nationwide support.",
  keywords:
    "Geely Ethiopia, Geely cars, SUV Ethiopia, Geely EX5, Geely EX2, Geely Panda Mini, Electric vehicles Ethiopia, Kerchanshe Group Geely, car dealer Ethiopia",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Geely Ethiopia | Official Distributor",
    description:
      "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads.",
    url: BASE_URL,
    siteName: "Geely Ethiopia",
    images: [
      {
        url: `${BASE_URL}/images/og-home.jpg`,
        width: 1200,
        height: 630,
        alt: "Geely Ethiopia - Official Distributor",
      },
    ],
    locale: "en_ET",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Geely Ethiopia | Official Distributor",
    description:
      "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles.",
    images: [`${BASE_URL}/images/og-home.jpg`],
    site: "@geelyethiopia",
  },
};

export default async function HomePage() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  // Fetched server-side (in parallel) so above-the-fold homepage sections are
  // present in the initial HTML instead of popping in after client fetches —
  // that gap was the page's LCP/layout-shift bottleneck. Every endpoint below
  // is `/public/*` (no per-user data), so this uses the cookie-free client —
  // forwarding the session cookie here would force this route to fully
  // server-render on every request instead of serving prerendered/ISR HTML.
  const client = publicApiClient;
  const [
    initialHeroSections,
    rawVehicles,
    initialPromotions,
    showcaseList,
    newsResponse,
    allReviews,
    financingBanksRaw,
    financingProgramsRaw,
    aboutData,
  ] = await Promise.all([
    client.get('/public/hero').then((r) => r.data).catch(() => []),
    client.get('/public/vehicles').then((r) => r.data).catch(() => []),
    client.get('/public/promotions').then((r) => r.data?.promotions ?? []).catch(() => []),
    client.get('/public/showcase').then((r) => r.data).catch(() => []),
    client.get('/public/news', { params: { pageSize: 6 } }).then((r) => r.data).catch(() => ({ items: [] })),
    client.get('/public/testimonials').then((r) => r.data).catch(() => []),
    client.get('/public/financing-banks').then((r) => r.data).catch(() => []),
    client.get('/public/financing-programs').then((r) => r.data).catch(() => []),
    client.get('/public/about').then((r) => r.data).catch(() => null),
  ]);

  const initialVehicles = (Array.isArray(rawVehicles) ? rawVehicles : [])
    .filter((v: any) => v.isActive && v.status === 'published')
    .sort((a: any, b: any) => Number(b.isFeatured) - Number(a.isFeatured) || String(a.name).localeCompare(b.name));

  // The public vehicles endpoint doesn't return category rows directly —
  // derive the same {id, name, slug, description, _count} shape from each
  // vehicle's own embedded `vehicleCategory`, counting published vehicles.
  const initialCategories = (() => {
    const bySlug = new Map<string, { id: string; name: string; slug: string; description: string | null; _count: { vehicles: number } }>();
    for (const v of initialVehicles) {
      const cat = v.vehicleCategory;
      if (!cat?.slug) continue;
      const existing = bySlug.get(cat.slug);
      if (existing) {
        existing._count.vehicles += 1;
      } else {
        bySlug.set(cat.slug, {
          id: v.categoryId || cat.slug,
          name: cat.name,
          slug: cat.slug,
          description: null,
          _count: { vehicles: 1 },
        });
      }
    }
    return Array.from(bySlug.values());
  })();

  const newsRows = Array.isArray(newsResponse?.items) ? newsResponse.items : [];

  const approvedReviews = (Array.isArray(allReviews) ? allReviews : []).filter((r: any) => r.isActive !== false);
  const featuredReviews = approvedReviews.filter((r: any) => r.isFeatured).slice(0, 6);
  const reviewsTotal = approvedReviews.length;
  const reviewsAvgRating =
    approvedReviews.length > 0
      ? approvedReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / approvedReviews.length
      : 0;

  // Admin → Settings → About → "Homepage Statistics" (Setting key
  // `about_page`, field `homeStats`) is the real, editable source for these
  // numbers — DEFAULT_STATS only covers the case where that hasn't been
  // configured yet.
  const initialStats = Array.isArray(aboutData?.homeStats) && aboutData.homeStats.length > 0
    ? aboutData.homeStats
    : DEFAULT_STATS;

  // Every active/published showcase, not just the first one — lets visitors
  // pick which vehicle's "Explore Every Angle" viewer they want (see
  // ShowcaseSection's vehicle tabs) instead of always seeing whichever
  // showcase happens to sort first.
  const curatedShowcases = (Array.isArray(showcaseList) ? showcaseList : []).map((showcase: any) => {
    const views = Array.isArray(showcase.views)
      ? (showcase.views as { angle: string; imageUrl: string; label: string }[]).map((view) => ({
          ...view,
          imageUrl: existingLocalImage(view.imageUrl) || view.imageUrl,
        }))
      : [];
    return { ...showcase, views };
  });

  // No admin-curated 360° showcases configured yet — derive the same shape
  // straight from real published vehicles (using their own gallery images)
  // instead of showing a generic/unrelated placeholder. A vehicle with no
  // images at all is skipped rather than faked.
  const derivedShowcases = initialVehicles
    .filter((v: any) => Array.isArray(v.images) && v.images.some((img: unknown) => typeof img === 'string' && img))
    .map((v: any) => {
      const images = (v.images as unknown[]).filter((img): img is string => typeof img === 'string' && img.length > 0);
      return {
        id: v.id,
        vehicleId: v.id,
        vehicleSlug: v.slug,
        vehicleName: v.name,
        title: `Explore the ${v.name}`,
        subtitle: null,
        views: images.map((imageUrl: string, index: number) => ({
          angle: String(index),
          imageUrl,
          label: index === 0 ? 'Exterior' : `View ${index + 1}`,
        })),
        modelUrl: null,
        ctaText: null,
        ctaLink: `/models/${v.slug}`,
        sortOrder: v.displayOrder ?? 0,
      };
    });

  const initialShowcases = curatedShowcases.length > 0 ? curatedShowcases : derivedShowcases;

  // API responses carry dates as ISO strings already (JSON has no Date type).
  const initialNewsArticles = newsRows.map((article: any) => ({
    ...article,
    imageUrl: existingLocalImage(article.imageUrl),
  }));

  // Home page teaser only needs a name + whether the bank actually has any
  // published programs (an inactive-but-listed bank with zero programs
  // shouldn't be shown as a financing option) and the single lowest real
  // rate across them — never a hardcoded/placeholder figure.
  const financingBanks = (Array.isArray(financingBanksRaw) ? financingBanksRaw : []).filter(
    (bank: any) => (bank._count?.financingPrograms ?? 1) > 0
  );
  const financingPrograms = Array.isArray(financingProgramsRaw) ? financingProgramsRaw : [];
  const startingFinancingRate = financingPrograms.length > 0
    ? Math.min(...financingPrograms.map((p: any) => Number(p.interestRate) || Infinity))
    : null;

  const initialReviewsData = {
    reviews: featuredReviews.map((review: any) => ({
      ...review,
      profileImage: existingLocalImage(review.profileImage),
    })),
    total_reviews: reviewsTotal,
    average_rating: reviewsAvgRating,
  };

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, websiteSchema]),
        }}
      />

      {/* Sequenced as a narrative rather than a stack: product (hero/models/
          spotlight) → brand story (about/showcase) → credibility (stats/
          trust) → promotions → financing (how to pay for it) → social proof
          (reviews) → location & services (map + after-sale/roadside/
          innovation cards) → final conversion push → reference info. */}
      <HeroSection initialHeroSections={initialHeroSections} />
      <ModelsShowcase initialCategories={initialCategories} initialVehicles={initialVehicles} />
      <SpotlightStrip vehicleName={initialShowcases[0]?.vehicleName ?? null} />
      <AboutSection />
      <ShowcaseSection initialShowcases={initialShowcases} />
      <StatisticsSection initialStats={initialStats} />
      <TrustSection />
      <PromotionsBanner initialPromotions={initialPromotions} />
      <FinancingSection banks={financingBanks} startingRate={startingFinancingRate} />
      <CustomerReviews initialData={initialReviewsData} />
      <DealerLocatorPreview />
      <CTAStrip />
      <FAQSection />
      <NewsSection initialArticles={initialNewsArticles} />
    </MainLayout>
  );
}
