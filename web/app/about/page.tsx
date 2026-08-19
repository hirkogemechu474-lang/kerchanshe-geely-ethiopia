'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileDrawer } from '@/components/MobileDrawer';
import {
  Award, Users, Globe, TrendingUp, Factory, Shield, Zap, Heart,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

type FeatureCard = { icon: string; title: string; description: string };
type HighlightItem = { value: string; label: string };
type StatsCard = { icon: string; title: string; description: string; gradient: string };

interface AboutContent {
  sectionHero: { eyebrow: string; title: string; subtitle: string; backgroundImage: string };
  partnership: {
    eyebrow: string; title: string; paragraphs: string[]; highlights: HighlightItem[]; rightImage: string;
  };
  geelyGlobal: { title: string; subtitle: string; features: FeatureCard[] };
  kerchansheGroup: {
    eyebrow: string; title: string; paragraphs: string[]; sectors: string[]; statsCards: StatsCard[];
  };
  whyChoose: { title: string; subtitle: string; features: FeatureCard[] };
  cta: {
    title: string; subtitle: string;
    primaryButton: { label: string; href: string };
    secondaryButton: { label: string; href: string };
  };
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Globe, Award, Zap, Shield, Factory, Users, TrendingUp, Heart,
};

function iconFor(name: string) {
  return ICON_MAP[name] ?? Shield;
}

const FALLBACK: AboutContent = {
  sectionHero: {
    eyebrow: 'ABOUT US',
    title: 'About Geely Ethiopia',
    subtitle:
      'Bringing global automotive excellence to Ethiopia through the trusted partnership of Zhejiang Geely Holding Group and Kerchanshe Group.',
    backgroundImage: '',
  },
  partnership: {
    eyebrow: 'A HISTORIC PARTNERSHIP',
    title: 'Global Engineering Meets Local Excellence',
    paragraphs: [
      'In April 2025, Kerchanshe Group announced a landmark agreement with Zhejiang Geely Holding Group (ZGH) to become the exclusive, official distributor of Geely vehicles in Ethiopia.',
      "This partnership brings together Geely's world-class automotive engineering, safety innovation, and design excellence with Kerchanshe Group's 20+ years of trusted local distribution, manufacturing infrastructure, and after-sales expertise.",
      'Operating through Kerchanshe Auto, the motor vehicles division of Kerchanshe Group, we are not just importing vehicles — we are building a complete automotive ecosystem with plans for local assembly, job creation, and technology transfer.',
    ],
    highlights: [
      { value: '2025', label: 'Exclusive Partnership Announced' },
      { value: '100%', label: 'Manufacturer Warranty & Support' },
      { value: 'Local', label: 'Assembly Plans in Progress' },
      { value: '25K+', label: 'Kerchanshe Group Employees' },
    ],
    rightImage: '',
  },
  geelyGlobal: {
    title: 'Zhejiang Geely Holding Group',
    subtitle:
      "One of the world's leading automotive groups, with a portfolio spanning multiple brands and innovative technologies.",
    features: [
      { icon: 'Globe', title: 'Global Reach', description: 'Operations in over 40 countries worldwide with production facilities across Asia, Europe, and beyond.' },
      { icon: 'Award', title: 'Premium Brands', description: 'Owns Volvo Cars, Polestar, Lynk & Co, Zeekr, Geometry, and Lotus — recognized for excellence.' },
      { icon: 'Zap', title: 'Innovation Leader', description: 'Pioneering electric and new energy vehicles with advanced battery and autonomous driving technology.' },
      { icon: 'Shield', title: 'Safety First', description: 'Multiple 5-star safety ratings globally, with C-NCAP and Euro NCAP recognition for engineering excellence.' },
    ],
  },
  kerchansheGroup: {
    eyebrow: 'SINCE 2003',
    title: "Kerchanshe Group: Ethiopia's Most Diversified Conglomerate",
    paragraphs: [
      'Founded in 2003, Kerchanshe Group is Ethiopia\'s largest coffee exporter and one of its most diversified conglomerates, with an annual coffee turnover exceeding US$100 million.',
      'The Group operates across 10+ business sectors:',
    ],
    sectors: [
      'Coffee export and agro-industry',
      'Manufacturing (Buna Plate, Buna Pen)',
      'Construction (AMAM Construction)',
      'Heavy equipment (Exclusive Caterpillar dealer)',
      'Logistics, hospitality, and automotive',
    ],
    statsCards: [
      { icon: 'Factory', title: 'Manufacturing', description: 'Buna Plate, Buna Pen production facilities', gradient: 'from-amber-500 to-amber-600' },
      { icon: 'Globe', title: 'Coffee Export', description: '$100M+ annual turnover, largest in Ethiopia', gradient: 'from-slate-700 to-blue-700' },
      { icon: 'TrendingUp', title: 'Heavy Equipment', description: 'Exclusive Caterpillar dealer in Ethiopia', gradient: 'from-blue-600 to-slate-800' },
      { icon: 'Users', title: '25,000+ Jobs', description: 'Major employer across multiple sectors', gradient: 'from-amber-600 to-yellow-500' },
    ],
  },
  whyChoose: {
    title: 'Why Choose Geely Ethiopia',
    subtitle: 'The perfect combination of global automotive excellence and trusted local service.',
    features: [
      { icon: 'Shield', title: 'Genuine Warranty', description: 'Full manufacturer warranty and technical support backed by Zhejiang Geely Holding Group on every vehicle sold.' },
      { icon: 'Factory', title: 'Local Assembly', description: 'Plans for local assembly of Geely vehicles in Ethiopia, contributing to job creation and industrial growth.' },
      { icon: 'Users', title: 'Trusted Service', description: '20+ years of Kerchanshe Group expertise in distribution, after-sales, and customer service across Ethiopia.' },
      { icon: 'Award', title: 'World-Class Quality', description: "Geely's global standards of engineering, safety, and design, proven across 40+ countries worldwide." },
      { icon: 'Zap', title: 'Future-Ready', description: 'Access to cutting-edge electric and new energy vehicle technology as Ethiopia transitions to sustainable mobility.' },
      { icon: 'Heart', title: 'Community Impact', description: "Commitment to Ethiopia's economic development through technology transfer and local capacity building." },
    ],
  },
  cta: {
    title: 'Ready to Experience Geely?',
    subtitle:
      'Visit our showroom in Sarbet, Addis Ababa, or book a test drive to experience the perfect combination of global excellence and local trust.',
    primaryButton: { label: 'Book a Test Drive', href: '/test-drive' },
    secondaryButton: { label: 'Find Our Showroom', href: '/dealers' },
  },
};

function mergeFallback(d: Partial<AboutContent> | null | undefined): AboutContent {
  if (!d) return FALLBACK;
  return {
    sectionHero: { ...FALLBACK.sectionHero, ...(d.sectionHero ?? {}) },
    partnership: {
      ...FALLBACK.partnership,
      ...(d.partnership ?? {}),
      paragraphs: d.partnership?.paragraphs?.length ? d.partnership.paragraphs : FALLBACK.partnership.paragraphs,
      highlights: d.partnership?.highlights?.length ? d.partnership.highlights : FALLBACK.partnership.highlights,
    },
    geelyGlobal: {
      ...FALLBACK.geelyGlobal,
      ...(d.geelyGlobal ?? {}),
      features: d.geelyGlobal?.features?.length ? d.geelyGlobal.features : FALLBACK.geelyGlobal.features,
    },
    kerchansheGroup: {
      ...FALLBACK.kerchansheGroup,
      ...(d.kerchansheGroup ?? {}),
      paragraphs: d.kerchansheGroup?.paragraphs?.length ? d.kerchansheGroup.paragraphs : FALLBACK.kerchansheGroup.paragraphs,
      sectors: d.kerchansheGroup?.sectors?.length ? d.kerchansheGroup.sectors : FALLBACK.kerchansheGroup.sectors,
      statsCards: d.kerchansheGroup?.statsCards?.length ? d.kerchansheGroup.statsCards : FALLBACK.kerchansheGroup.statsCards,
    },
    whyChoose: {
      ...FALLBACK.whyChoose,
      ...(d.whyChoose ?? {}),
      features: d.whyChoose?.features?.length ? d.whyChoose.features : FALLBACK.whyChoose.features,
    },
    cta: {
      ...FALLBACK.cta,
      ...(d.cta ?? {}),
      primaryButton: { ...FALLBACK.cta.primaryButton, ...(d.cta?.primaryButton ?? {}) },
      secondaryButton: { ...FALLBACK.cta.secondaryButton, ...(d.cta?.secondaryButton ?? {}) },
    },
  };
}

export default function AboutPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<AboutContent>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/public/about')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(mergeFallback(d)))
      .catch(() => setData(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="min-h-screen bg-ice flex flex-col">
      <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="flex-1">
        {/* 1. Hero section */}
        <section
          className="relative overflow-hidden text-white py-20 sm:py-28"
          style={
            data.sectionHero.backgroundImage
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(10,26,64,0.9), rgba(30,64,175,0.85)), url(${data.sectionHero.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <div
            className={
              data.sectionHero.backgroundImage
                ? ''
                : 'absolute inset-0 bg-gradient-to-br from-navy via-blue-900 to-geely-blue'
            }
          />
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-gold blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
          </div>

          <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 text-gold px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {data.sectionHero.eyebrow}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-[1.05]">
                {data.sectionHero.title}
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl">
                {data.sectionHero.subtitle}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Partnership story */}
        <section className="py-20 bg-white relative">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <div className="inline-block bg-gold/10 text-gold px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                  {data.partnership.eyebrow}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight mb-6 leading-tight">
                  {data.partnership.title}
                </h2>
                <div className="space-y-5">
                  {data.partnership.paragraphs.map((p, i) => (
                    <p key={i} className="text-steel text-lg leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </div>

              {/* Right: 2x2 stat grid OR image */}
              {data.partnership.rightImage ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-navy/15 aspect-square">
                  <img
                    src={data.partnership.rightImage}
                    alt={data.partnership.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {data.partnership.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="group relative rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-100 overflow-hidden hover:-translate-y-1 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-gold/20 to-transparent blur-2xl" />
                      <div className="relative">
                        <div className="text-3xl sm:text-4xl font-extrabold text-geely-blue mb-2 tracking-tight">
                          {h.value}
                        </div>
                        <div className="text-sm font-medium text-steel">{h.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Geely Global — dark section */}
        <section className="py-20 sm:py-24 bg-navy text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-geely-blue blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-amber-500 blur-3xl" />
          </div>

          <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
                {data.geelyGlobal.title}
              </h2>
              <p className="text-blue-100 text-lg">{data.geelyGlobal.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {data.geelyGlobal.features.map((f, i) => {
                const Icon = iconFor(f.icon);
                return (
                  <div
                    key={i}
                    className="group relative rounded-3xl p-8 bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all text-center"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-geely-blue to-blue-500 mb-6 shadow-lg shadow-blue-700/30 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-extrabold text-xl mb-3">{f.title}</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4. Kerchanshe Group */}
        <section className="py-20 bg-ice">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: 2x2 cards */}
              <div className="order-2 lg:order-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                  {data.kerchansheGroup.statsCards.map((c, i) => {
                    const Icon = iconFor(c.icon);
                    return (
                      <div
                        key={i}
                        className={`rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${c.gradient} relative overflow-hidden group`}
                      >
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10 blur-xl" />
                        <Icon size={30} className="mb-4 relative" />
                        <h4 className="font-extrabold text-lg mb-2 relative">{c.title}</h4>
                        <p className="text-sm opacity-90 leading-relaxed relative">{c.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: narrative */}
              <div className="order-1 lg:order-2">
                <div className="inline-block bg-gold/10 text-gold px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
                  {data.kerchansheGroup.eyebrow}
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy mb-6 tracking-tight leading-tight">
                  {data.kerchansheGroup.title}
                </h2>
                <div className="space-y-5 mb-6">
                  {data.kerchansheGroup.paragraphs.map((p, i) => (
                    <p key={i} className="text-steel text-lg leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
                <ul className="space-y-3">
                  {data.kerchansheGroup.sectors.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 text-steel text-lg">
                      <span className="text-gold font-bold mt-0.5">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Why Choose */}
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight mb-4">
                {data.whyChoose.title}
              </h2>
              <p className="text-steel text-lg">{data.whyChoose.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {data.whyChoose.features.map((f, i) => {
                const Icon = iconFor(f.icon);
                return (
                  <div
                    key={i}
                    className="group relative rounded-3xl p-8 bg-white border border-slate-100 hover:border-transparent hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-geely-blue/10 text-geely-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-geely-blue group-hover:text-white">
                      <Icon size={26} />
                    </div>
                    <h3 className="font-extrabold text-xl text-navy mb-3">{f.title}</h3>
                    <p className="text-steel leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. CTA */}
        <section className="py-20 sm:py-24 bg-gradient-to-br from-navy via-blue-900 to-geely-blue text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-gold blur-3xl" />
          </div>
          <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
              {data.cta.title}
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              {data.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={data.cta.primaryButton.href}
                className="group inline-flex items-center justify-center gap-2 bg-gold text-navy px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-amber-400 transition-colors shadow-xl shadow-amber-500/30"
              >
                {data.cta.primaryButton.label}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={data.cta.secondaryButton.href}
                className="inline-flex items-center justify-center gap-2 bg-white text-navy px-8 py-4 rounded-xl font-extrabold text-lg hover:bg-blue-50 transition-colors"
              >
                {data.cta.secondaryButton.label}
              </Link>
            </div>
          </div>
          {!loaded && null}
        </section>
      </main>

      <Footer />
    </div>
  );
}
