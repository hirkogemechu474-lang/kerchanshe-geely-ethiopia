import { Metadata } from "next";
import { MainLayout } from "@/components/MainLayout";
import TechnologyHero from "@/components/technology/TechnologyHero";
import GEAArchitecture from "@/components/technology/GEAArchitecture";
import EMiHybrid from "@/components/technology/EMiHybrid";
import ShortBladeBattery from "@/components/technology/ShortBladeBattery";
import SafetySystems from "@/components/technology/SafetySystems";
import SmartFeatures from "@/components/technology/SmartFeatures";
import TechnologyCTA from "@/components/technology/TechnologyCTA";

export const metadata: Metadata = {
  title: "Geely Technology | Innovation & Engineering",
  description:
    "Explore Geely's cutting-edge technology: GEA Architecture, EM-i Super Hybrid, Short Blade Battery, and advanced safety systems. Global engineering excellence.",
  keywords:
    "Geely technology, GEA Architecture, EM-i hybrid, Short Blade Battery, automotive innovation, smart features, safety systems",
  openGraph: {
    title: "Geely Technology | Innovation & Engineering",
    description:
      "Discover the advanced technology powering Geely vehicles. From hybrid systems to battery technology and safety innovations.",
    images: [
      {
        url: "/images/technology-og.jpg",
        width: 1200,
        height: 630,
        alt: "Geely Technology",
      },
    ],
  },
};

export default function TechnologyPage() {
  return (
    <MainLayout>
      <TechnologyHero />
      <GEAArchitecture />
      <EMiHybrid />
      <ShortBladeBattery />
      <SafetySystems />
      <SmartFeatures />
      <TechnologyCTA />
    </MainLayout>
  );
}
