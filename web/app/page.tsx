import { MainLayout } from "@/components/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import ModelsShowcase from "@/components/home/ModelsShowcase";
import SpotlightStrip from "@/components/home/SpotlightStrip";
import dynamic from "next/dynamic";
import PromotionsBanner from "@/components/home/PromotionsBanner";
import { getOrganizationSchema, getWebsiteSchema } from "@/lib/schema";
import { Metadata } from "next";

// Keep the above-the-fold path small. These sections retain SSR markup but
// their interactive client code is loaded in separate chunks as needed.
const AboutSection = dynamic(() => import("@/components/home/AboutSection"), { ssr: true });
const StatisticsSection = dynamic(() => import("@/components/home/StatisticsSection"), { ssr: true });
const ShowcaseSection = dynamic(() => import("@/components/home/ShowcaseSection"), { ssr: true });
const ServicesSection = dynamic(() => import("@/components/home/ServicesSection"), { ssr: true });
const CTAStrip = dynamic(() => import("@/components/home/CTAStrip"), { ssr: true });
const TrustSection = dynamic(() => import("@/components/home/TrustSection"), { ssr: true });
const DealerLocatorPreview = dynamic(() => import("@/components/home/DealerLocatorPreview"), { ssr: true });
const CustomerReviews = dynamic(() => import("@/components/home/CustomerReviews"), { ssr: true });
const FAQSection = dynamic(() => import("@/components/home/FAQSection"), { ssr: true });
const NewsSection = dynamic(() => import("@/components/home/NewsSection"), { ssr: true });

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

export default function HomePage() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, websiteSchema]),
        }}
      />

      <HeroSection />
      <ModelsShowcase />
      <PromotionsBanner />
      <SpotlightStrip />
      <AboutSection />
      <ShowcaseSection />
      <StatisticsSection />
      <ServicesSection />
      <CTAStrip />
      <TrustSection />
      <DealerLocatorPreview />
      <CustomerReviews />
      <FAQSection />
      <NewsSection />
    </MainLayout>
  );
}
