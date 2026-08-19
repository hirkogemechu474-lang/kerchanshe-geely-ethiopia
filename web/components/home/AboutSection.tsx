'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface AboutContent {
  title: string;
  description: string;
  image: string;
  keyPoints: string[];
}

const DEFAULT_HOME_ABOUT: AboutContent = {
  title: 'About Geely Ethiopia',
  description:
    'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market.',
  image:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20geely%20car%20showroom%20in%20addis%20ababa%20with%20suv%20vehicles%20on%20display%20professional%20lighting&image_size=landscape_4_3',
  keyPoints: [
    'Official authorized distributor with comprehensive warranty coverage',
    'Nationwide service network with certified technicians',
    'Commitment to bringing global automotive excellence to Ethiopian roads',
  ],
};

export default function AboutSection() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_HOME_ABOUT);

  useEffect(() => {
    fetch('/api/public/about')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.homeAbout) {
          setContent({ ...DEFAULT_HOME_ABOUT, ...d.homeAbout });
        }
      })
      .catch(() => {});
  }, []);

  const keyPoints = content.keyPoints?.length ? content.keyPoints : DEFAULT_HOME_ABOUT.keyPoints;

  return (
    <section className="py-20 sm:py-24 bg-white relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute top-10 -left-32 w-80 h-80 rounded-full bg-blue-50 opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 w-96 h-96 rounded-full bg-amber-50 opacity-60 blur-3xl" />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              About Geely Ethiopia
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.1] mb-5">
              {content.title || DEFAULT_HOME_ABOUT.title}
            </h2>

            <p className="text-lg text-steel leading-relaxed mb-8 max-w-xl">
              {content.description || DEFAULT_HOME_ABOUT.description}
            </p>

            {/* Key points */}
            <ul className="space-y-4 mb-10">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-geely-blue/10">
                    <CheckCircle2 className="w-4 h-4 text-geely-blue" />
                  </span>
                  <span className="text-steel leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-95 transition-colors shadow-lg shadow-slate-900/15"
              >
                Read Our Story
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/test-drive"
                className="inline-flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 transition-colors"
              >
                Book a Test Drive
              </Link>
            </div>
          </div>

          {/* Visual column */}
          <div className="relative">
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-navy/20 aspect-[4/3] ring-1 ring-black/5">
              {content.image ? (
                <img
                  src={content.image}
                  alt={content.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#e8eef8] to-[#cfdaef] flex items-center justify-center">
                  <p className="text-navy/70 text-center px-6 font-semibold">
                    {content.title}
                  </p>
                </div>
              )}
            </div>

            {/* Floating stat badge — top-left */}
            <div className="absolute -top-6 -left-6 bg-white rounded-2xl shadow-xl shadow-navy/10 p-4 ring-1 ring-black/5 w-48 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                  ⚡
                </div>
                <div>
                  <div className="text-xl font-extrabold text-navy leading-none">Since 2003</div>
                  <div className="text-xs text-steel">Kerchanshe Group</div>
                </div>
              </div>
            </div>

            {/* Floating badge — bottom-right */}
            <div className="absolute -bottom-6 -right-4 bg-gradient-to-br from-navy to-geely-blue text-white rounded-2xl shadow-xl shadow-blue-700/30 p-4 w-56 hidden sm:block">
              <div className="text-xs uppercase tracking-widest opacity-80 mb-1">Exclusive</div>
              <div className="font-bold">Official Distributor</div>
              <div className="text-sm opacity-80 text-xs mt-0.5">Zhejiang Geely × Kerchanshe Auto</div>
            </div>

            {/* Decorative corner dots */}
            <div className="absolute -z-10 -top-8 -right-8 w-32 h-32 rounded-full border-2 border-dashed border-amber-300/60" />
            <div className="absolute -z-10 -bottom-10 -left-10 w-32 h-32 rounded-full border-2 border-dashed border-blue-300/50" />
          </div>
        </div>
      </div>
    </section>
  );
}
