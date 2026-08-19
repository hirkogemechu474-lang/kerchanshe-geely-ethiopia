'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AboutContent {
  title: string;
  description: string;
  image: string;
  keyPoints: string[];
}

const DEFAULT_HOME_ABOUT: AboutContent = {
  title: 'Discover Geely',
  description:
    'Geely Auto Group is a leading global automobile manufacturer based in Hangzhou, China. Founded in 1997, we are trusted in more than 80 markets worldwide — and through our exclusive Ethiopian distributor, Kerchanshe Auto, we bring that same global engineering to Ethiopian roads.',
  image:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20geely%20car%20showroom%20in%20addis%20ababa%20with%20suv%20vehicles%20on%20display%20professional%20lighting&image_size=landscape_4_3',
  keyPoints: [
    'Founded in 1997 — headquartered in Hangzhou, China',
    'Trusted in 80+ markets across the globe',
    'Exclusive Ethiopian distributor: Kerchanshe Auto',
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
    <section className="bg-white py-16 md:py-24 border-t border-line">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Copy */}
          <div>
            <div className="text-[12px] tracking-[0.2em] text-geely-blue font-bold mb-4 uppercase">
              Discover Geely
            </div>
            <h2 className="disp text-[30px] md:text-[42px] text-navy font-extrabold leading-[1.1] mb-6">
              {content.title || DEFAULT_HOME_ABOUT.title}
            </h2>
            <p className="text-[15px] md:text-[16px] text-steel leading-relaxed mb-8 max-w-xl">
              {content.description || DEFAULT_HOME_ABOUT.description}
            </p>

            <ul className="space-y-3 mb-9">
              {keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-geely-blue shrink-0" />
                  <span className="text-navy text-sm font-medium leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/about"
              className="inline-flex items-center gap-2 bg-navy text-white text-[13px] font-bold px-7 py-3.5 rounded-lg hover:bg-geely-blue transition-colors"
            >
              Learn More
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] ring-1 ring-black/5">
              {content.image ? (
                <img
                  src={content.image}
                  alt={content.title || 'Geely Ethiopia'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#e8eef8] to-[#cfdaef] flex items-center justify-center">
                  <p className="text-navy/70 text-center px-6 font-semibold">
                    {content.title || 'Geely Ethiopia'}
                  </p>
                </div>
              )}
            </div>

            {/* Credential badge */}
            <div className="absolute -bottom-6 -right-4 sm:right-6 bg-white rounded-2xl shadow-xl shadow-navy/10 p-4 ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-geely-blue/10 text-geely-blue flex items-center justify-center text-lg font-extrabold">
                  G
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-navy leading-none">Since 1997</div>
                  <div className="text-[11px] text-steel mt-1">Global engineering, everywhere</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
