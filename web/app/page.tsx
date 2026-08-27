import { MainLayout } from "@/components/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import ModelsShowcase from "@/components/home/ModelsShowcase";
import SpotlightStrip from "@/components/home/SpotlightStrip";
import dynamic from "next/dynamic";
import PromotionsBanner from "@/components/home/PromotionsBanner";
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/schema";
import { prisma } from "@/lib/prisma";
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
  title: "Geely Ethiopia | Official Distributor by Kerchanshe Auto",
  description:
    "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads. Official distributor with nationwide support.",
  keywords:
    "Geely Ethiopia, Geely cars, SUV Ethiopia, Geely Coolray, Geely Emgrand, Electric vehicles Ethiopia, Kerchanshe Auto, car dealer Ethiopia",
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
  const now = new Date();
  const [
    initialHeroSections,
    initialCategories,
    initialVehicles,
    initialPromotions,
    showcaseRows,
    newsRows,
    featuredReviews,
    reviewsTotal,
    reviewsAvg,
    statsSetting,
  ] = await Promise.all([
    prisma.heroSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        subtitle: true,
        description: true,
        mediaType: true,
        imageUrl: true,
        videoUrl: true,
        posterUrl: true,
        buttonText: true,
        buttonLink: true,
        sortOrder: true,
      },
    }).catch(() => []),
    prisma.vehicleCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { vehicles: { where: { isActive: true, status: 'published' } } } },
      },
      orderBy: { displayOrder: 'asc' },
    }).catch(() => []),
    prisma.vehicle.findMany({
      where: { isActive: true, status: 'published' },
      orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        categoryId: true,
        vehicleCategory: { select: { name: true, slug: true } },
        heroImageUrl: true,
        images: true,
        badge: true,
        isFeatured: true,
      },
    }).catch(() => []),
    prisma.promotion.findMany({
      where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    }).catch(() => []),
    prisma.vehicleShowcase.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }).catch(() => []),
    prisma.newsArticle.findMany({
      where: { status: 'published' },
      orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      select: {
        id: true,
        title: true,
        category: true,
        publishDate: true,
        createdAt: true,
        imageUrl: true,
        excerpt: true,
      },
    }).catch(() => []),
    prisma.review.findMany({
      where: { status: 'approved', isActive: true, isFeatured: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }).catch(() => []),
    prisma.review.count({ where: { status: 'approved', isActive: true } }).catch(() => 0),
    prisma.review.aggregate({
      where: { status: 'approved', isActive: true },
      _avg: { rating: true },
    }).catch(() => ({ _avg: { rating: 0 } })),
    prisma.setting.findFirst({ where: { key: 'homepage_stats' } }).catch(() => null),
  ]);

  const initialShowcase = (() => {
    const showcase = showcaseRows[0];
    if (!showcase) return null;
    const views = Array.isArray(showcase.views)
      ? (showcase.views as { angle: string; imageUrl: string; label: string }[]).map((view) => ({
          ...view,
          imageUrl: existingLocalImage(view.imageUrl) || view.imageUrl,
        }))
      : [];
    return { ...showcase, views };
  })();

  const initialNewsArticles = newsRows.map((article) => ({
    ...article,
    publishDate: article.publishDate ? article.publishDate.toISOString() : null,
    createdAt: article.createdAt.toISOString(),
    imageUrl: existingLocalImage(article.imageUrl),
  }));

  const initialReviewsData = {
    reviews: featuredReviews.map((review) => ({
      ...review,
      profileImage: existingLocalImage(review.profileImage),
    })),
    total_reviews: reviewsTotal,
    average_rating: reviewsAvg._avg.rating || 0,
  };

  const initialStats = (() => {
    if (!statsSetting) return DEFAULT_STATS;
    try {
      const parsed = JSON.parse(statsSetting.value);
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  })();

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
      <ShowcaseSection initialShowcase={initialShowcase} />
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
