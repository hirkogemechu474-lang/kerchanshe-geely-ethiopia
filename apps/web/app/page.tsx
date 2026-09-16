import { MainLayout } from "@/components/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import ModelsShowcase from "@/components/home/ModelsShowcase";
import SpotlightStrip from "@/components/home/SpotlightStrip";
import dynamic from "next/dynamic";
import PromotionsBanner from "@/components/home/PromotionsBanner";
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/schema";
import { serverApiClient } from "@/lib/serverApiClient";
import { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

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
    "Geely Ethiopia, Geely cars, SUV Ethiopia, Geely Coolray, Geely Emgrand, Electric vehicles Ethiopia, Kerchanshe Group Geely, car dealer Ethiopia",
  alternates: {
    canonical: "https://geelyethiopia.com",
  },
  openGraph: {
    title: "Geely Ethiopia | Official Distributor",
    description:
      "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads.",
    url: "https://geelyethiopia.com",
    siteName: "Geely Ethiopia",
    images: [
      {
        url: "https://geelyethiopia.com/images/og-home.jpg",
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
    images: ["https://geelyethiopia.com/images/og-home.jpg"],
    site: "@geelyethiopia",
  },
};

export default async function HomePage() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  // Fetched server-side (in parallel) so above-the-fold homepage sections are
  // present in the initial HTML instead of popping in after client fetches —
  // that gap was the page's LCP/layout-shift bottleneck.
  const client = await serverApiClient();
  const [
    initialHeroSections,
    rawVehicles,
    initialPromotions,
    showcaseList,
    newsResponse,
    allReviews,
  ] = await Promise.all([
    client.get('/public/hero').then((r) => r.data).catch(() => []),
    client.get('/public/vehicles').then((r) => r.data).catch(() => []),
    client.get('/public/promotions').then((r) => r.data?.promotions ?? []).catch(() => []),
    client.get('/public/showcase').then((r) => r.data).catch(() => []),
    client.get('/public/news', { params: { pageSize: 6 } }).then((r) => r.data).catch(() => ({ items: [] })),
    client.get('/public/testimonials').then((r) => r.data).catch(() => []),
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

  // No public endpoint exposes an admin-configurable stats blob today —
  // falls back to the same defaults the original code used when unset.
  const initialStats = DEFAULT_STATS;

  // Every active/published showcase, not just the first one — lets visitors
  // pick which vehicle's "Explore Every Angle" viewer they want (see
  // ShowcaseSection's vehicle tabs) instead of always seeing whichever
  // showcase happens to sort first.
  const initialShowcases = (Array.isArray(showcaseList) ? showcaseList : []).map((showcase: any) => {
    const views = Array.isArray(showcase.views)
      ? (showcase.views as { angle: string; imageUrl: string; label: string }[]).map((view) => ({
          ...view,
          imageUrl: existingLocalImage(view.imageUrl) || view.imageUrl,
        }))
      : [];
    return { ...showcase, views };
  });

  // API responses carry dates as ISO strings already (JSON has no Date type).
  const initialNewsArticles = newsRows.map((article: any) => ({
    ...article,
    imageUrl: existingLocalImage(article.imageUrl),
  }));

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
          trust) → promotions → social proof (reviews) → location & services
          (map + after-sale/roadside/innovation cards) → final conversion
          push → reference info. */}
      <HeroSection initialHeroSections={initialHeroSections} />
      <ModelsShowcase initialCategories={initialCategories} initialVehicles={initialVehicles} />
      <SpotlightStrip />
      <AboutSection />
      <ShowcaseSection initialShowcases={initialShowcases} />
      <StatisticsSection initialStats={initialStats} />
      <TrustSection />
      <PromotionsBanner initialPromotions={initialPromotions} />
      <CustomerReviews initialData={initialReviewsData} />
      <DealerLocatorPreview />
      <CTAStrip />
      <FAQSection />
      <NewsSection initialArticles={initialNewsArticles} />
    </MainLayout>
  );
}
