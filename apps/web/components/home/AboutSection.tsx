'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
    'Geely Auto Group is a leading global automobile manufacturer based in Hangzhou, China. Founded in 1997, we are trusted in more than 80 markets worldwide, and through our exclusive Ethiopian distributor, Kerchanshe Group Geely, we bring that same global engineering to Ethiopian roads.',
  // Was an IDE-generated text-to-image URL (trae.ai) left over from
  // scaffolding — that endpoint returns a "generating..." placeholder graphic
  // rather than a real photo, so this whole section rendered broken whenever
  // no admin-configured image was set. A real Geely EX2 photo, bundled as a
  // static asset so this default works on any checkout.
  image: '/images/about-geely.jpg',
  keyPoints: [
    'Founded in 1997, headquartered in Hangzhou, China',
    'Trusted in 80+ markets across the globe',
    'Exclusive Ethiopian distributor: Kerchanshe Group Geely',
  ],
};

export default function AboutSection() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_HOME_ABOUT);

  useEffect(() => {
    fetch('/api/public/about', { cache: 'no-store' })
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
    <section className="bg-ice py-20 md:py-28">
      <div className="page-container grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
        {/* Photo side — a contained, framed image instead of a full-bleed
            background with text overlaid on top of it. Nothing ever
            renders on top of the photo itself, so there's no risk of a
            panel or gradient landing on someone's face. */}
        <div className="order-1 lg:order-1">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-xl sm:aspect-[16/11]">
            {content.image ? (
              <Image
                src={content.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-navy" />
            )}
          </div>
        </div>

        {/* Text side */}
        <div className="order-2 lg:order-2">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-gold" aria-hidden />
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-active-blue">
              Discover Geely
            </span>
          </div>
          <h2 className="disp mb-6 text-[30px] font-extrabold leading-[1.1] text-navy md:text-[42px]">
            {content.title || DEFAULT_HOME_ABOUT.title}
          </h2>
          <p className="mb-8 text-[15px] leading-relaxed text-steel md:text-[16px]">
            {content.description || DEFAULT_HOME_ABOUT.description}
          </p>

          <ul className="mb-9 space-y-3">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-active-blue shrink-0" />
                <span className="text-navy text-sm font-medium leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-8">
            <Button href="/about" variant="solid" size="md">
              Know More
              <span aria-hidden>&rarr;</span>
            </Button>

            {/* Credential badge */}
            <div className="flex items-center gap-3 sm:border-l sm:border-line sm:pl-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-active-blue/10 text-lg font-extrabold text-active-blue">
                G
              </div>
              <div>
                <div className="text-[15px] font-extrabold leading-none text-navy">Since 1997</div>
                <div className="mt-1 text-[11px] text-steel">Global engineering, everywhere</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
