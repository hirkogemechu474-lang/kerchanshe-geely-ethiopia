'use client';

import { useEffect, useState } from 'react';
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
            <div className="relative h-32 md:h-40 rounded-lg overflow-hidden bg-black/20">
              {currentPromo.bannerImage ? (
                <img
                  src={currentPromo.bannerImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Zap size={48} className="text-white/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30"></div>
              <div className="absolute inset-0 flex flex-col justify-center p-6">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">{currentPromo.title}</h3>
                <p className="text-sm md:text-base text-white/90 mb-4 line-clamp-2">
                  {currentPromo.description}
                </p>
                {currentPromo.ctaButtonText && currentPromo.ctaButtonLink && (
                  <Button href={currentPromo.ctaButtonLink} variant="solid" size="sm" className="w-fit">
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
