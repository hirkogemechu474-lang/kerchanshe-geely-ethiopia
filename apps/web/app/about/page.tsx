'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Award, Users, Globe, TrendingUp, Factory, Shield, Zap, Heart, Target, Sparkles, Cpu, DollarSign, Star,
  ArrowRight, ChevronLeft, ChevronRight, Phone,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type FeatureCard = { icon: string; title: string; description: string };
type HighlightItem = { value: string; label: string };
type StatsCard = { icon: string; title: string; description: string; gradient: string };
type ValueItem = { icon: string; title: string; description: string; image?: string };

interface AboutContent {
  sectionHero: {
    eyebrow: string; title: string; subtitle: string; backgroundImage: string;
    mediaType?: string; videoUrl?: string; posterUrl?: string;
  };
  statsBar: { items: HighlightItem[] };
  designPhilosophy: { eyebrow: string; title: string; paragraphs: string[]; image: string };
  partnership: {
    eyebrow: string; title: string; paragraphs: string[]; highlights: HighlightItem[]; rightImage: string;
  };
  missionVisionValues: {
    eyebrow: string;
    mission: { title: string; text: string };
    vision: { title: string; text: string };
    values: ValueItem[];
    image: string;
  };
  historyTimeline: {
    eyebrow: string;
    title: string;
    subtitle: string;
    milestones: { year: string; title: string; description: string; image?: string }[];
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
  Globe, Award, Zap, Shield, Factory, Users, TrendingUp, Heart, Target, Sparkles, Cpu, DollarSign, Star,
};

function iconFor(name: string) {
  return ICON_MAP[name] ?? Shield;
}

const FALLBACK: AboutContent = {
  sectionHero: {
    eyebrow: 'ABOUT US',
    title: 'A future shaped by innovation, driven by the vision of Geely Ethiopia and powered by people.',
    subtitle:
      'Bringing global automotive excellence to Ethiopia through the trusted partnership of Zhejiang Geely Holding Group and Kerchanshe Group.',
    backgroundImage: '',
    mediaType: 'IMAGE',
    videoUrl: '',
    posterUrl: '',
  },
  statsBar: {
    items: [
      { value: '30+', label: 'Global Markets Served' },
      { value: '10M+', label: 'Vehicles Delivered' },
      { value: '12+', label: 'Manufacturing Plants' },
      { value: '50K+', label: 'Employees Worldwide' },
    ],
  },
  designPhilosophy: {
    eyebrow: 'OVERVIEW',
    title: 'Inspired by Nature, Engineered for Tomorrow',
    paragraphs: [
      "Every Geely vehicle is inspired by nature's energy, from Stonehenge-inspired Matrix LED headlight designs to bold Icefall vertical grilles and lava-flow LED taillights, combining elegance with dynamic presence.",
      "This design language carries through every model Kerchanshe Group Geely brings to Ethiopia, pairing striking presence with world-class engineering and safety. Every curve and detail reflects confidence, innovation, and the timeless design philosophy of Geely Automobile.",
    ],
    image: '',
  },
  partnership: {
    eyebrow: 'A HISTORIC PARTNERSHIP',
    title: 'Global Engineering Meets Local Excellence',
    paragraphs: [
      'In April 2025, Kerchanshe Group announced a landmark agreement with Zhejiang Geely Holding Group (ZGH) to become the exclusive, official distributor of Geely vehicles in Ethiopia.',
      "This partnership brings together Geely's world-class automotive engineering, safety innovation, and design excellence with Kerchanshe Group's 20+ years of trusted local distribution, manufacturing infrastructure, and after-sales expertise.",
      'Operating through Kerchanshe Group Geely, the motor vehicles division of Kerchanshe Group, we are not just importing vehicles. We are building a complete automotive ecosystem with plans for local assembly, job creation, and technology transfer.',
    ],
    highlights: [
      { value: '2025', label: 'Exclusive Partnership Announced' },
      { value: '100%', label: 'Manufacturer Warranty & Support' },
      { value: 'Local', label: 'Assembly Plans in Progress' },
      { value: '25K+', label: 'Kerchanshe Group Employees' },
    ],
    rightImage: '',
  },
  missionVisionValues: {
    eyebrow: 'OUR PURPOSE',
    mission: {
      title: 'Our Mission',
      text: "Geely's mission is to design vehicles and technologies that put people first, combining innovation, safety, and smart engineering to deliver mobility that is accessible, reliable, and environmentally responsible. Every Geely model reflects our commitment to progress and our belief that exceptional mobility should empower every journey, brought to Ethiopia through Kerchanshe Group Geely's local expertise and support.",
    },
    vision: {
      title: 'Our Vision',
      text: 'To be the most competitive and respected global automotive brand, leading the transformation of the industry through innovation, sustainability, and human-centered design, with Kerchanshe Group Geely driving that vision forward in Ethiopia.',
    },
    values: [
      { icon: 'Star', title: 'Value', description: 'Our commitment to offering high value to our users is reflected in every strategic decision.', image: '/images/about-value.jpg' },
      { icon: 'Zap', title: 'Innovation', description: 'We continue to demonstrate our pursuit of the most advanced technological innovations.', image: '/images/about-innovation.jpg' },
      { icon: 'Heart', title: 'New Energy', description: 'Our early adoption of new energy development underscores our dedication to sustainable solutions.', image: '/images/about-new-energy.jpg' },
      { icon: 'Globe', title: 'Globalization', description: 'Our journey into globalization, beginning in 2002, shapes our identity.', image: '/images/about-globalization.jpg' },
    ],
    image: '',
  },
  historyTimeline: {
    eyebrow: 'OUR JOURNEY',
    title: 'Milestones',
    subtitle: 'From a coffee export business to Ethiopia\'s official Geely distributor — a journey of growth, innovation, and partnership.',
    milestones: [
      { year: '2003', title: 'Kerchanshe Group Founded', description: "Began as a coffee export business and grew into one of Ethiopia's most diversified conglomerates.", image: '' },
      { year: 'April 2025', title: 'Exclusive Geely Partnership Signed', description: 'Kerchanshe Group and Zhejiang Geely Holding Group announce an exclusive distribution agreement.', image: '' },
      { year: '2025', title: 'Kerchanshe Group Geely Launches', description: 'Opens its showroom in Sarbet, Addis Ababa, bringing genuine Geely vehicles to Ethiopian customers.', image: '' },
      { year: 'In Progress', title: 'Local Assembly & Technology Transfer', description: 'Plans underway for local vehicle assembly in Ethiopia, creating jobs and building industrial capacity.', image: '' },
    ],
  },
  geelyGlobal: {
    title: 'Zhejiang Geely Holding Group',
    subtitle:
      "One of the world's leading automotive groups, with a portfolio spanning multiple brands and innovative technologies.",
    features: [
      { icon: 'Globe', title: 'Global Reach', description: 'Operations in over 40 countries worldwide with production facilities across Asia, Europe, and beyond.' },
      { icon: 'Award', title: 'Premium Brands', description: 'Owns Volvo Cars, Polestar, Lynk & Co, Zeekr, Geometry, and Lotus, recognized for excellence.' },
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
    title: 'Need Assistance?',
    subtitle:
      'Have a question or need support? Our dedicated team is ready to provide the guidance you need. Connect with us to experience the professional service and cutting-edge innovation that define the Geely brand.',
    primaryButton: { label: 'Contact Us', href: '/contact' },
    secondaryButton: { label: 'Book a Test Drive', href: '/test-drive' },
  },
};

function mergeFallback(d: Partial<AboutContent> | null | undefined): AboutContent {
  if (!d) return FALLBACK;
  return {
    sectionHero: { ...FALLBACK.sectionHero, ...(d.sectionHero ?? {}) },
    statsBar: {
      items: d.statsBar?.items?.length ? d.statsBar.items : FALLBACK.statsBar.items,
    },
    designPhilosophy: {
      ...FALLBACK.designPhilosophy,
      ...(d.designPhilosophy ?? {}),
      paragraphs: d.designPhilosophy?.paragraphs?.length ? d.designPhilosophy.paragraphs : FALLBACK.designPhilosophy.paragraphs,
    },
    partnership: {
      ...FALLBACK.partnership,
      ...(d.partnership ?? {}),
      paragraphs: d.partnership?.paragraphs?.length ? d.partnership.paragraphs : FALLBACK.partnership.paragraphs,
      highlights: d.partnership?.highlights?.length ? d.partnership.highlights : FALLBACK.partnership.highlights,
    },
    missionVisionValues: {
      ...FALLBACK.missionVisionValues,
      ...(d.missionVisionValues ?? {}),
      mission: { ...FALLBACK.missionVisionValues.mission, ...(d.missionVisionValues?.mission ?? {}) },
      vision: { ...FALLBACK.missionVisionValues.vision, ...(d.missionVisionValues?.vision ?? {}) },
      values: d.missionVisionValues?.values?.length
        ? d.missionVisionValues.values.map((v: ValueItem, i: number) => ({
            ...v,
            image: v.image || FALLBACK.missionVisionValues.values[i]?.image || '',
          }))
        : FALLBACK.missionVisionValues.values,
    },
    historyTimeline: {
      ...FALLBACK.historyTimeline,
      ...(d.historyTimeline ?? {}),
      milestones: d.historyTimeline?.milestones?.length ? d.historyTimeline.milestones : FALLBACK.historyTimeline.milestones,
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

function HistoryCarousel({ milestones }: { milestones: { year: string; title: string; description: string; image?: string }[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {milestones.map((m, i) => (
          <div
            key={i}
            className="shrink-0 w-[320px] sm:w-[400px] snap-start"
          >
            {m.image ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-4 shadow-lg">
                <Image src={m.image} alt={m.title} fill sizes="400px" className="object-cover" />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-midnight-surface dark:to-midnight flex items-center justify-center">
                <span className="text-5xl font-black text-geely-blue/20">{m.year}</span>
              </div>
            )}
            <div className="text-sm font-black text-geely-blue uppercase tracking-wide mb-1">{m.year}</div>
            <h4 className="font-extrabold text-lg text-navy dark:text-ice mb-1.5">{m.title}</h4>
            <p className="text-steel dark:text-steel-light text-sm leading-relaxed">{m.description}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200 z-10"
        aria-label="Previous"
      >
        <ChevronLeft size={20} className="text-navy" />
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200 z-10"
        aria-label="Next"
      >
        <ChevronRight size={20} className="text-navy" />
      </button>
    </div>
  );
}

export default function AboutPage() {
  const [data, setData] = useState<AboutContent>(FALLBACK);
  const [loaded, setLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    fetch('/api/public/about', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(mergeFallback(d)))
      .catch(() => setData(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVideoReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const isVideoHero = data.sectionHero.mediaType === 'VIDEO' && !!data.sectionHero.videoUrl;
  const heroPoster = data.sectionHero.posterUrl || data.sectionHero.backgroundImage;

  return (
    <>
      {/* 1. Hero section */}
      <section
        className="relative min-h-[min(680px,80vh)] overflow-hidden bg-black text-white flex items-center"
        style={
          !isVideoHero && data.sectionHero.backgroundImage
            ? {
                backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.82), rgba(0,0,0,0.45)), url(${data.sectionHero.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {isVideoHero ? (
          <>
            {heroPoster && (
              <div
                className="absolute inset-0"
                style={{ backgroundImage: `url(${heroPoster})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            )}
            {videoReady && (
              <video
                key={data.sectionHero.videoUrl}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={data.sectionHero.videoUrl} type="video/mp4" />
                <track kind="captions" src="/captions/no-dialogue.vtt" srcLang="en" label="English" default />
              </video>
            )}
            <div className="absolute inset-0 bg-black/50" />
          </>
        ) : (
          <div
            className={
              data.sectionHero.backgroundImage
                ? ''
                : 'absolute inset-0 bg-gradient-to-br from-black via-[#101318] to-[#194bff]'
            }
          />
        )}

        <div className="relative max-w-[1280px] mx-auto px-5 sm:px-10 lg:px-16 py-24 sm:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-xs font-bold tracking-[0.28em] uppercase text-[#7ea2ff] mb-6">
              {data.sectionHero.eyebrow}
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-8 tracking-tight leading-[1.1] text-balance">
              {data.sectionHero.title}
            </h1>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
              {data.sectionHero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* 1b. Stats bar */}
      <section className="bg-black text-white border-b border-white/15 relative">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
            {data.statsBar.items.map((s, i) => (
              <div key={i} className="py-8 sm:py-10 px-4 sm:px-8 first:pl-0">
                <div className="text-3xl sm:text-5xl font-black tracking-tight mb-2">{s.value}</div>
                <div className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-[0.16em]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Overview / Design Philosophy */}
      <section className="py-24 sm:py-32 bg-white dark:bg-midnight-surface transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {data.designPhilosophy.image && (
              <div className="relative overflow-hidden rounded-2xl aspect-video lg:aspect-square bg-slate-100 shadow-xl">
                <Image
                  src={data.designPhilosophy.image}
                  alt={data.designPhilosophy.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            )}
            <div className={data.designPhilosophy.image ? '' : 'lg:col-span-2 max-w-3xl mx-auto text-center'}>
              <div className={`inline-block text-geely-blue text-xs font-bold tracking-[0.2em] uppercase mb-6 ${data.designPhilosophy.image ? '' : 'mx-auto'}`}>
                {data.designPhilosophy.eyebrow}
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-black dark:text-ice tracking-tight mb-8 leading-[1.05] text-balance">
                {data.designPhilosophy.title}
              </h2>
              <div className="space-y-5">
                {data.designPhilosophy.paragraphs.map((p, i) => (
                  <p key={i} className="text-steel dark:text-steel-light text-lg leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Mission — clean beige style with image */}
      <section className="bg-[#f0ebe3] dark:bg-midnight transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-steel dark:text-steel-light text-lg sm:text-xl mb-4">
                A Commitment to Excellence and Sustainability
              </p>
              <h2 className="text-5xl sm:text-6xl lg:text-[5rem] font-black text-black dark:text-ice tracking-tight leading-[1.05] uppercase mb-10">
                {data.missionVisionValues.mission.title}
              </h2>
              <p className="text-steel dark:text-steel-light text-lg sm:text-xl leading-relaxed max-w-xl">
                {data.missionVisionValues.mission.text}
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-slate-200 dark:bg-midnight-surface shadow-xl">
              {data.missionVisionValues.image ? (
                <img
                  src={data.missionVisionValues.image}
                  alt="Our Mission"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-midnight-surface dark:to-midnight-line flex items-center justify-center">
                  <span className="text-6xl font-black text-slate-300 dark:text-midnight-line/50">M</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Our Vision — clean beige style with image */}
      <section className="bg-[#f0ebe3] dark:bg-midnight transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1 relative overflow-hidden rounded-2xl aspect-[4/3] bg-slate-200 dark:bg-midnight-surface shadow-xl">
              {data.missionVisionValues.image ? (
                <img
                  src={data.missionVisionValues.image}
                  alt="Our Vision"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-midnight-surface dark:to-midnight-line flex items-center justify-center">
                  <span className="text-6xl font-black text-slate-300 dark:text-midnight-line/50">V</span>
                </div>
              )}
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-steel dark:text-steel-light text-lg sm:text-xl mb-4">
                Driving the Future of Mobility
              </p>
              <h2 className="text-5xl sm:text-6xl lg:text-[5rem] font-black text-black dark:text-ice tracking-tight leading-[1.05] uppercase mb-10">
                {data.missionVisionValues.vision.title}
              </h2>
              <p className="text-steel dark:text-steel-light text-lg sm:text-xl leading-relaxed max-w-xl">
                {data.missionVisionValues.vision.text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Our Values — image cards */}
      <section className="py-24 sm:py-32 bg-[#f0ebe3] dark:bg-midnight transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.missionVisionValues.values.map((v, i) => (
              <div
                key={i}
                className="group bg-white dark:bg-midnight-surface rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {v.image ? (
                    <Image
                      src={v.image}
                      alt={v.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-midnight dark:to-midnight-surface flex items-center justify-center">
                      {(() => { const Icon = iconFor(v.icon); return <Icon size={48} className="text-geely-blue/30" />; })()}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-extrabold text-xl text-navy dark:text-ice mb-3 uppercase tracking-wide">
                    {v.title}
                  </h3>
                  <p className="text-steel dark:text-steel-light leading-relaxed text-[15px]">
                    {v.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. History — OUR JOURNEY section */}
      <section className="py-24 sm:py-32 bg-[#f8f9fa] dark:bg-midnight transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-block bg-geely-blue/10 text-geely-blue px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6">
              {data.historyTimeline.eyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy dark:text-ice tracking-tight mb-6">
              {data.historyTimeline.title}
            </h2>
            <p className="text-steel dark:text-steel-light text-lg leading-relaxed">
              {data.historyTimeline.subtitle}
            </p>
          </div>

          <HistoryCarousel milestones={data.historyTimeline.milestones} />
        </div>
      </section>

      {/* 7. CTA — Let's Talk Now */}
      <section className="py-24 sm:py-32 bg-white dark:bg-midnight-surface transition-colors">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0a1628] via-[#101d35] to-[#194bff] rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6 tracking-tight">
                {data.cta.title}
              </h2>
              <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                {data.cta.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={data.cta.primaryButton.href}
                  className="group inline-flex items-center justify-center gap-2 bg-white text-[#0a1628] px-8 py-4 font-extrabold text-lg hover:bg-white/90 transition-colors rounded-full"
                >
                  <Phone size={18} />
                  {data.cta.primaryButton.label}
                </Link>
                <Link
                  href={data.cta.secondaryButton.href}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-4 font-extrabold text-lg hover:bg-white/10 transition-colors rounded-full"
                >
                  {data.cta.secondaryButton.label}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
