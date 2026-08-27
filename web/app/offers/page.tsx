"use client";

import { MainLayout } from "@/components/MainLayout";
import { Calendar, Tag, Car, Gift, Percent } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Promotion {
  id: string;
  title: string;
  description: string;
  bannerImage: string | null;
  ctaButtonText: string | null;
  ctaButtonLink: string | null;
  isFeatured: boolean;
  isActive: boolean;
  startDate: string;
  endDate: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function OffersPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/public/promotions');
      const data = await response.json();
      if (data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const activePromotions = promotions.filter(p => p.isActive);
  const featuredPromotions = promotions.filter(p => p.isFeatured && p.isActive);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-steel dark:text-steel-light">Loading offers...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="bg-gradient-to-br from-navy via-geely-blue to-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold-bright font-bold mb-3">
            SPECIAL OFFERS & PROMOTIONS
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            Current Offers
          </h1>
          <p className="text-blue-50 text-base max-w-2xl">
            Discover exclusive offers and promotions on Geely vehicles. From special financing to seasonal discounts, find the perfect deal for your next vehicle.
          </p>
        </div>
      </div>

      {/* Featured Offers */}
      {featuredPromotions.length > 0 && (
        <section className="py-16 bg-ice dark:bg-midnight">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <h2 className="disp text-3xl text-navy dark:text-ice font-bold mb-8 text-center">
              Featured Offers
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPromotions.map((promo) => (
                <div key={promo.id} className="bg-white dark:bg-midnight-surface border-2 border-gold rounded-lg overflow-hidden shadow-lg">
                  {/* Image */}
                  {promo.bannerImage ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={promo.bannerImage} 
                        alt={promo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-steel dark:text-steel-light text-sm text-center p-6">
                      {promo.title}
                      <br />
                      Promotional Banner
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <Percent className="text-red-600" size={20} />
                      <span className="bg-gold text-[#2c2308] text-xs font-bold px-3 py-1 rounded-full">
                        FEATURED
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-navy dark:text-ice mb-3">{promo.title}</h3>
                    <p className="text-steel dark:text-steel-light text-sm leading-relaxed mb-4">{promo.description}</p>
                    
                    {/* Validity */}
                    <div className="flex items-center gap-2 text-xs text-steel dark:text-steel-light mb-4">
                      <Calendar size={16} />
                      Valid until {new Date(promo.endDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>

                    <Link
                      href={promo.ctaButtonLink || "/quote"}
                      className="block text-center bg-geely-blue text-white font-bold text-sm py-3 px-6 rounded hover:bg-opacity-90 transition-all"
                    >
                      {promo.ctaButtonText || "Get Quote with This Offer"}
                    </Link>
                    <Link href={`/offers/${promo.id}`} className="block text-center text-geely-blue font-semibold text-sm mt-3">
                      View offer details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Active Offers */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="disp text-3xl text-navy dark:text-ice font-bold mb-8">
            All Current Offers
          </h2>
          
          {activePromotions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-navy dark:text-ice mb-2">No Active Offers</h3>
              <p className="text-steel dark:text-steel-light">Check back soon for exciting promotions and special offers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePromotions.map((promo) => (
                <div key={promo.id} className={`bg-white dark:bg-midnight-surface border rounded-lg overflow-hidden hover:shadow-lg transition-all ${
                  promo.isFeatured ? "border-gold" : "border-line dark:border-midnight-line"
                }`}>
                  {/* Image */}
                  {promo.bannerImage ? (
                    <div className="h-32 overflow-hidden">
                      <img 
                        src={promo.bannerImage} 
                        alt={promo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-xs text-steel dark:text-steel-light text-center p-4">
                      {promo.title} Banner
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Percent className="text-red-600" size={16} />
                      {promo.isFeatured && (
                        <span className="bg-gold text-[#2c2308] text-xs font-bold px-2 py-1 rounded">
                          FEATURED
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-navy dark:text-ice mb-2 leading-tight">{promo.title}</h3>
                    <p className="text-steel dark:text-steel-light text-sm leading-relaxed mb-3 line-clamp-2">{promo.description}</p>
                    
                    {/* Validity */}
                    <div className="flex items-center gap-2 text-xs text-steel dark:text-steel-light mb-4">
                      <Calendar size={14} />
                      Until {new Date(promo.endDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>

                    <Link
                      href={promo.ctaButtonLink || "/quote"}
                      className="block text-center bg-navy text-white font-bold text-xs py-2 px-4 rounded hover:bg-opacity-90 transition-all"
                    >
                      {promo.ctaButtonText || "Apply This Offer"}
                    </Link>
                    <Link href={`/offers/${promo.id}`} className="block text-center text-geely-blue font-semibold text-xs mt-3">
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="py-12 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h3 className="text-2xl font-bold text-navy dark:text-ice mb-6 text-center">
            Terms & Conditions
          </h3>
          <div className="bg-white dark:bg-midnight-surface p-6 rounded-lg border border-line dark:border-midnight-line">
            <ul className="space-y-2 text-sm text-steel dark:text-steel-light">
              <li>• All offers are valid for new vehicle purchases only and cannot be combined with other promotions unless specified.</li>
              <li>• Financing offers are subject to credit approval and may vary based on creditworthiness.</li>
              <li>• Trade-in values are subject to vehicle inspection and market conditions.</li>
              <li>• Limited stock available for promotional vehicles. Offers valid while supplies last.</li>
              <li>• Geely Ethiopia reserves the right to modify or discontinue offers without prior notice.</li>
              <li>• Additional terms and conditions may apply. Please consult with our sales team for complete details.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h3 className="disp text-3xl font-bold mb-4">
            Ready to Take Advantage of These Offers?
          </h3>
          <p className="text-[#b9cbe4] text-base mb-8 max-w-2xl mx-auto">
            Visit our showroom or contact our sales team to learn more about current promotions and find the perfect deal for you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/quote"
              className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
            >
              Request Quote
            </Link>
            <Link
              href="/dealers"
              className="border border-white border-opacity-50 text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface hover:bg-opacity-10 transition-all"
            >
              Visit Showroom
            </Link>
            <a
              href="tel:+251110000000"
              className="border border-white border-opacity-50 text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface dark:hover:bg-midnight-surface hover:bg-opacity-10 transition-all"
            >
              Call Now
            </a>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
