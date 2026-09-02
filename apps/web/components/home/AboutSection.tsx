'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface AboutContent {
  title: string;
  description: string;
  image: string;
  keyPoints: string[];
}

const DEFAULT_HOME_ABOUT: AboutContent = {
  title: 'Discover Geely',
  description:
    'Geely Auto Group is a leading global automobile manufacturer based in Hangzhou, China. Founded in 1997, we are trusted in more than 80 markets worldwide — and through our exclusive Ethiopian distributor, Kerchanshe Group Geely, we bring that same global engineering to Ethiopian roads.',
  image:
    'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20geely%20car%20showroom%20in%20addis%20ababa%20with%20suv%20vehicles%20on%20display%20professional%20lighting&image_size=landscape_4_3',
  keyPoints: [
    'Founded in 1997 — headquartered in Hangzhou, China',
    'Trusted in 80+ markets across the globe',
    'Exclusive Ethiopian distributor: Kerchanshe Group Geely',
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
    <section className="relative overflow-hidden text-white">
      {/* Full-bleed background image with a navy gradient overlay, mirroring
          geely.com.eg's "About Geely" band rather than the old side-by-side
          card layout. */}
      <div className="absolute inset-0">
        {content.image ? (
          <img
            src={content.image}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
      </div>

      <div className="relative page-container py-20 md:py-28">
        <div className="max-w-xl">
          <div className="text-[12px] tracking-[0.2em] text-active-blue font-bold mb-4 uppercase">
            Discover Geely
          </div>
          <h2 className="disp text-[30px] md:text-[42px] font-extrabold leading-[1.1] mb-6">
            {content.title || DEFAULT_HOME_ABOUT.title}
          </h2>
          <p className="text-[15px] md:text-[16px] text-[#c3d2ea] leading-relaxed mb-8">
            {content.description || DEFAULT_HOME_ABOUT.description}
          </p>

          <ul className="space-y-3 mb-9">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-active-blue shrink-0" />
                <span className="text-white text-sm font-medium leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>

          <Button href="/about" variant="outline" tone="dark" size="md">
            Know More
            <span aria-hidden>&rarr;</span>
          </Button>
        </div>

        {/* Credential badge */}
        <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-4 ring-1 ring-white/15 mt-14">
          <div className="w-10 h-10 rounded-xl bg-active-blue/20 text-active-blue flex items-center justify-center text-lg font-extrabold shrink-0">
            G
          </div>
          <div>
            <div className="text-[15px] font-extrabold leading-none">Since 1997</div>
            <div className="text-[11px] text-[#c3d2ea] mt-1">Global engineering, everywhere</div>
          </div>
        </div>
      </div>
    </section>
  );
}
