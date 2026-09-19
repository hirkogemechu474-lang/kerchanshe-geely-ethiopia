'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Promotion {
  id: string;
  title: string;
  description: string;
  bannerImage: string | null;
  ctaButtonText: string | null;
  ctaButtonLink: string | null;
  isFeatured: boolean;
}

interface PromotionsBannerProps {
  // Fetched server-side (see app/page.tsx) so the banner is present on first
  // paint instead of popping in after a client fetch and shifting layout.
  initialPromotions?: Promotion[];
}

export default function PromotionsBanner({ initialPromotions = [] }: PromotionsBannerProps) {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(initialPromotions.length === 0);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/public/promotions?featured=true&limit=5');
      const result = await response.json();
      setPromotions(result.promotions || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  const currentPromo = promotions[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-8 bg-gradient-to-r from-accent-purple to-active-blue text-white">
      <div className="page-container">
        <div className="flex items-center gap-6">
          {/* Slider */}
          <div className="flex-1 relative">
            {/* Height comes from the content column below (in normal flow),
                not a fixed h-32/h-40 — that used to clip the title/description/
                button whenever they needed more than 128-160px, which is what
                made the text unreadable. The image/overlay layers are
                absolutely positioned to fill whatever height the content sets. */}
            <div className="relative rounded-lg overflow-hidden bg-black/20">
              {currentPromo.bannerImage ? (
                <Image
                  src={currentPromo.bannerImage}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 100vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap size={48} className="text-white/50" />
                </div>
              )}
              {/* Darker, directional scrim (matches the main hero treatment)
                  so the text reads reliably no matter what's behind it. */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10"></div>
              <div className="relative z-10 flex flex-col justify-center gap-2 min-h-[200px] sm:min-h-[220px] md:min-h-[260px] p-6 md:p-8">
                <h3
                  className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight"
                  style={{ textShadow: '0 1px 10px rgba(0,0,0,0.45)' }}
                >
                  {currentPromo.title}
                </h3>
                <p
                  className="text-sm md:text-base text-white/90 leading-relaxed line-clamp-2 max-w-2xl"
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}
                >
                  {currentPromo.description}
                </p>
                {currentPromo.ctaButtonText && currentPromo.ctaButtonLink && (
                  <Button href={currentPromo.ctaButtonLink} variant="solid" size="sm" className="w-fit mt-2">
                    {currentPromo.ctaButtonText}
                  </Button>
                )}
              </div>
            </div>

            {/* Navigation Buttons */}
            {promotions.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  aria-label="Previous promotion"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next promotion"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {promotions.length > 1 && (
            <div className="flex gap-2">
              {promotions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to promotion ${index + 1}`}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
