"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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

export default function HeroSection() {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/hero')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setHeroSections(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading hero content:', err);
        setLoading(false);
      });
  }, []);

  // Auto-rotate hero sections every 7 seconds
  useEffect(() => {
    if (heroSections.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroSections.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [heroSections.length]);

  // Default content if no hero sections
  // Keep the stable fallback visible while the CMS hero request is loading.
  // This prevents the LCP region from being blank on the initial render.
  if (loading || heroSections.length === 0) {
    return (
      <section className="relative min-h-[520px] md:h-[560px] bg-gradient-to-br from-navy via-[#123a72] to-geely-blue text-white overflow-hidden">
        {/* Decorative circles */}
        <div className="hidden md:block absolute right-[-60px] bottom-[-40px] w-[640px] h-[640px] border border-white border-opacity-[0.14] rounded-full"></div>
        <div className="hidden md:block absolute right-[60px] bottom-[80px] w-[420px] h-[420px] border border-gold border-opacity-35 rounded-full"></div>

        {/* Placeholder */}
        <div className="hidden md:flex absolute right-[60px] bottom-[40px] w-[520px] h-[280px] bg-white bg-opacity-[0.08] border border-dashed border-white border-opacity-40 rounded-lg items-center justify-center text-[12px] text-white text-opacity-65 text-center px-5">
          Hero vehicle photography /<br />
          looping video placeholder
          <br />
          (3/4 studio angle, flagship model)
        </div>

        {/* Default Content */}
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 md:py-0 md:h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-5">
              GLOBAL ENGINEERING · BUILT FOR ETHIOPIA
            </div>
            <h1 className="disp text-4xl sm:text-[52px] leading-[1.08] max-w-[620px] font-bold mb-5">
              Move forward. In every direction.
            </h1>
            <p className="text-base max-w-[480px] text-[#d8e4f5] leading-relaxed mb-8">
              Explore the full Geely range — from efficient city SUVs to family-ready flagships — backed by nationwide dealer support and genuine parts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/quote"
                className="bg-gold text-[#2c2308] font-bold text-sm px-7 py-[14px] rounded hover:bg-opacity-90 transition-all"
              >
                Get a Quote
              </Link>
              <Link
                href="/models"
                className="border border-white border-opacity-50 text-white font-semibold text-sm px-7 py-[14px] rounded hover:bg-white hover:bg-opacity-10 transition-all"
              >
                Explore Models →
              </Link>
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
          <video
            key={currentHero.id}
            autoPlay
            muted
            loop
            playsInline
            poster={currentHero.posterUrl || undefined}
            className="w-full h-full object-cover scale-105"
            style={{ filter: 'brightness(0.85)' }}
          >
            <source src={currentHero.videoUrl} type="video/mp4" />
          </video>
          {/* Enhanced Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
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
            style={{ filter: 'brightness(0.85)' }}
          />
          {/* Enhanced Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </motion.div>
      ) : (
        // Fallback gradient background
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#123a72] to-geely-blue"></div>
      )}

      {/* Decorative circles */}
      <div className="absolute right-[-60px] bottom-[-40px] w-[640px] h-[640px] border border-white border-opacity-[0.14] rounded-full"></div>
      <div className="absolute right-[60px] bottom-[80px] w-[420px] h-[420px] border border-gold border-opacity-35 rounded-full"></div>

      {/* Content */}
      <div className="relative max-w-[1280px] mx-auto px-6 md:px-10 h-full flex flex-col justify-center z-10">
        <motion.div
          key={currentHero.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {currentHero.subtitle && (
            <motion.div 
              className="text-[11px] md:text-[13px] tracking-[0.16em] text-gold font-bold mb-4 md:mb-5 uppercase"
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
            <Link
              href="/quote"
              className="group bg-gold text-[#2c2308] font-bold text-[14px] md:text-[15px] px-7 md:px-8 py-[14px] md:py-[16px] rounded-lg hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-gold/50 text-center"
            >
              <span className="inline-flex items-center gap-2">
                Get a Quote
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </Link>
            {currentHero.buttonText && currentHero.buttonLink && (
              <Link
                href={currentHero.buttonLink}
                className="group border-2 border-white border-opacity-60 text-white font-semibold text-[14px] md:text-[15px] px-7 md:px-8 py-[14px] md:py-[16px] rounded-lg hover:bg-white hover:bg-opacity-10 hover:border-opacity-100 transition-all duration-300 backdrop-blur-sm text-center"
              >
                <span className="inline-flex items-center gap-2">
                  {currentHero.buttonText}
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
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
                  ? 'bg-gold w-12 shadow-lg shadow-gold/50'
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
