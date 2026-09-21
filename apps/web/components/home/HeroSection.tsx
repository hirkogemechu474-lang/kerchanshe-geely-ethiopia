"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { withBasePath } from "@/lib/publicPath";

interface HeroSection {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  mediaType: string;
  imageUrl: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  sortOrder: number;
}

interface HeroSectionProps {
  // Fetched server-side (see app/page.tsx) so the real hero image/video is
  // already in the initial HTML instead of appearing only after a client
  // fetch resolves — that gap was the page's LCP bottleneck.
  initialHeroSections?: HeroSection[];
}

export default function HeroSection({ initialHeroSections = [] }: HeroSectionProps) {
  const [heroSections] = useState<HeroSection[]>(initialHeroSections);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);

  // Auto-rotate hero sections every 7 seconds
  useEffect(() => {
    if (heroSections.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroSections.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [heroSections.length]);

  // Let the LCP paint (poster/text) happen before fetching the hero video.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVideoReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Default content if there's no active CMS hero content configured.
  if (heroSections.length === 0) {
    return (
      <section className="relative min-h-[520px] md:h-[560px] bg-mesh-blue text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="hidden md:block absolute right-[-60px] bottom-[-40px] w-[640px] h-[640px] border border-white border-opacity-[0.14] rounded-full"></div>
        <div className="hidden md:block absolute right-[60px] bottom-[80px] w-[420px] h-[420px] border border-active-blue border-opacity-35 rounded-full"></div>

        {/* Placeholder */}
        <div className="hidden md:flex absolute right-[60px] bottom-[40px] w-[520px] h-[280px] bg-white bg-opacity-[0.08] border border-dashed border-white border-opacity-40 rounded-lg items-center justify-center text-[12px] text-white text-opacity-65 text-center px-5">
          Hero vehicle photography /<br />
          looping video placeholder
          <br />
          (3/4 studio angle, flagship model)
        </div>

        {/* Default Content */}
        <div className="relative page-container py-16 md:py-0 md:h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-[13px] tracking-[0.14em] text-active-blue font-bold mb-5">
              GLOBAL ENGINEERING · BUILT FOR ETHIOPIA
            </div>
            <h1 className="disp text-4xl sm:text-[52px] leading-[1.08] max-w-[620px] font-bold mb-5">
              Move forward. In every direction.
            </h1>
            <p className="text-base max-w-[480px] text-[#d8e4f5] leading-relaxed mb-8">
              Explore the full Geely range, from efficient city SUVs to family-ready flagships, backed by nationwide dealer support and genuine parts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button href="/quote" variant="solid" size="lg">
                Get a Quote
              </Button>
              <Button href="/models" variant="outline" tone="dark" size="lg">
                Explore Models →
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const currentHero = heroSections[currentIndex];

  // Extra safety check
  if (!currentHero) {
    return null;
  }

  return (
    <section className="relative h-[560px] md:h-[640px] lg:h-[720px] text-white overflow-hidden">
      {/* Background Media with Parallax Effect */}
      {currentHero.mediaType === 'VIDEO' && currentHero.videoUrl ? (
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          {currentHero.posterUrl && (
            <Image
              src={currentHero.posterUrl}
              alt={currentHero.title}
              fill
              priority={currentIndex === 0}
              sizes="100vw"
              quality={85}
              className="object-cover scale-105"
              style={{ filter: 'brightness(0.95)' }}
            />
          )}
          {/* Hero videos run 14-20MB+; deferring mounting the <video> until
              after first paint keeps it from competing with the LCP
              text/poster render. Once mounted, preload="auto" tells the
              browser to start buffering immediately instead of waiting on
              autoplay to trigger the fetch, so playback starts sooner. */}
          {videoReady && (
            // No `poster` here: the <Image> above already shows it, and
            // repeating it on the <video> would both re-fetch the same file
            // and give Chrome a second, later Largest Contentful Paint candidate.
            <video
              key={currentHero.id}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover scale-105"
              style={{ filter: 'brightness(0.95)' }}
            >
              <source src={currentHero.videoUrl} type="video/mp4" />
              <track kind="captions" src={withBasePath('/captions/no-dialogue.vtt')} srcLang="en" label="English" default />
            </video>
          )}
          {/* Overlay for text readability, kept light so the video reads
              clearly instead of looking washed out. */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </motion.div>
      ) : currentHero.imageUrl ? (
        <motion.div 
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src={currentHero.imageUrl}
            alt={currentHero.title}
            fill
            priority={currentIndex === 0}
            sizes="100vw"
            quality={85}
            className="w-full h-full object-cover scale-105"
            style={{ filter: 'brightness(0.95)' }}
          />
          {/* Overlay for text readability, kept light so the image reads
              clearly instead of looking washed out. */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        </motion.div>
      ) : (
        // Fallback gradient background
        <div className="absolute inset-0 bg-mesh-blue"></div>
      )}

      {/* Decorative circles */}
      <div className="absolute right-[-60px] bottom-[-40px] w-[640px] h-[640px] border border-white border-opacity-[0.14] rounded-full"></div>
      <div className="absolute right-[60px] bottom-[80px] w-[420px] h-[420px] border border-active-blue border-opacity-35 rounded-full"></div>

      {/* Content */}
      <div className="relative page-container h-full flex flex-col justify-center z-10">
        <motion.div
          key={currentHero.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {currentHero.subtitle && (
            <motion.div 
              className="text-[11px] md:text-[13px] tracking-[0.16em] text-active-blue font-bold mb-4 md:mb-5 uppercase"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {currentHero.subtitle}
            </motion.div>
          )}
          <motion.h1 
            className="disp text-[40px] md:text-[56px] lg:text-[68px] leading-[1.05] max-w-[620px] font-extrabold mb-4 md:mb-5 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ 
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              letterSpacing: '-0.02em'
            }}
          >
            {currentHero.title}
          </motion.h1>
          {currentHero.description && (
            <motion.p 
              className="text-[15px] md:text-[17px] max-w-[520px] text-gray-100 leading-relaxed mb-7 md:mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ textShadow: '0 1px 10px rgba(0,0,0,0.4)' }}
            >
              {currentHero.description}
            </motion.p>
          )}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 md:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Button href="/quote" variant="solid" size="lg" className="group">
              <span className="inline-flex items-center gap-2">
                Get a Quote
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Button>
            {currentHero.buttonText && currentHero.buttonLink && (
              <Button href={currentHero.buttonLink} variant="outline" tone="dark" size="lg" className="group">
                <span className="inline-flex items-center gap-2">
                  {currentHero.buttonText}
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Carousel Indicators - Enhanced */}
      {heroSections.length > 1 && (
        <motion.div 
          className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          {heroSections.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentIndex
                  ? 'bg-active-blue w-12 shadow-lg shadow-active-blue/50'
                  : 'bg-white bg-opacity-40 hover:bg-opacity-60 w-8'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </motion.div>
      )}
    </section>
  );
}
