"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import { Battery, Zap, MapPin, Clock, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  description: string;
  images: any;
  specifications: any;
  basePrice: number;
  finalPrice: number;
  hidePrice?: boolean;
  discountAmount: number;
  discountType: string;
  badge: string;
  isFeatured: boolean;
  heroImageUrl: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  iconUrl: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  metaTitle: string;
  metaDescription: string;
  vehicles: Vehicle[];
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategory() {
      try {
        const response = await fetch(`/api/public/categories/${categorySlug}`);
        
        if (response.status === 404) {
          // Category not found, might be a different page
          router.push('/404');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load category');
        }

        const data = await response.json();
        setCategory(data.category);
      } catch (err) {
        console.error('Error fetching category:', err);
        setError('Failed to load category');
      } finally {
        setLoading(false);
      }
    }

    fetchCategory();
  }, [categorySlug, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-geely-blue border-t-transparent"></div>
            <p className="mt-4 text-steel">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !category) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-navy mb-4">Category Not Found</h1>
            <p className="text-steel mb-6">The category you're looking for doesn't exist.</p>
            <Link
              href="/models"
              className="inline-block bg-geely-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
            >
              Browse All Models
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isElectric = categorySlug === 'electric';

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-navy text-white py-20">
        {category.heroImageUrl && (
          <div className="absolute inset-0 opacity-20">
            <img 
              src={category.heroImageUrl} 
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative max-w-[1280px] mx-auto px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            {category.name.toUpperCase()}
          </div>
          <h1 className="disp text-5xl font-bold mb-4">
            {category.metaTitle || `${category.name} Vehicles`}
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            {category.metaDescription || category.description}
          </p>
        </div>
      </div>

      {/* Electric-specific Features */}
      {isElectric && (
        <section className="py-12 bg-ice">
          <div className="max-w-[1280px] mx-auto px-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Battery className="text-green-600" size={24} />
                </div>
                <h3 className="font-bold text-navy mb-2">Long Range</h3>
                <p className="text-xs text-steel">
                  Up to 520km on a single charge
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="text-blue-600" size={24} />
                </div>
                <h3 className="font-bold text-navy mb-2">Fast Charging</h3>
                <p className="text-xs text-steel">
                  30 minutes to 80% with DC fast charging
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="text-purple-600" size={24} />
                </div>
                <h3 className="font-bold text-navy mb-2">Charging Network</h3>
                <p className="text-xs text-steel">
                  Growing network across Ethiopia
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="text-orange-600" size={24} />
                </div>
                <h3 className="font-bold text-navy mb-2">Home Charging</h3>
                <p className="text-xs text-steel">
                  Convenient overnight charging at home
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Vehicles Grid */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-8">
            Available {category.name} Models
          </h2>

          {category.vehicles.length === 0 ? (
            <div className="text-center py-12 bg-ice rounded-lg">
              <p className="text-steel text-lg mb-4">
                No vehicles available in this category yet.
              </p>
              <Link
                href="/models"
                className="inline-block text-geely-blue font-semibold hover:underline"
              >
                Browse All Models
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.vehicles.map((vehicle) => {
                const images = Array.isArray(vehicle.images) ? vehicle.images : [];
                const mainImage = vehicle.heroImageUrl || images[0] || '/placeholder-vehicle.jpg';
                const specs = vehicle.specifications || {};
                const range = specs.range || null;
                const battery = specs.battery || null;

                return (
                  <div 
                    key={vehicle.id}
                    className="bg-white rounded-lg overflow-hidden border border-line hover:shadow-xl transition-all"
                  >
                    {/* Image */}
                    <div className="relative h-56 bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
                      <img 
                        src={mainImage}
                        alt={vehicle.name}
                        className="w-full h-full object-cover"
                      />
                      {vehicle.badge && (
                        <span className="absolute top-4 right-4 bg-gold text-navy text-xs font-bold px-3 py-1 rounded-full">
                          {vehicle.badge}
                        </span>
                      )}
                      {vehicle.isFeatured && (
                        <span className="absolute top-4 left-4 bg-geely-blue text-white text-xs font-bold px-3 py-1 rounded-full">
                          FEATURED
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-navy mb-2">{vehicle.name}</h3>
                      <p className="text-sm text-steel mb-4 line-clamp-2">
                        {vehicle.description}
                      </p>

                      {/* Electric-specific info */}
                      {isElectric && (range || battery) && (
                        <div className="mb-4 space-y-2">
                          {range && (
                            <div className="flex items-center gap-2 text-xs text-steel">
                              <Battery size={16} className="text-green-600" />
                              <span>Range: {range}</span>
                            </div>
                          )}
                          {battery && (
                            <div className="flex items-center gap-2 text-xs text-steel">
                              <Zap size={16} className="text-blue-600" />
                              <span>{battery}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div className="mb-4">
                        <Link
                          href={`/quote?model=${vehicle.slug}`}
                          className="text-2xl font-bold text-navy hover:text-geely-blue transition-colors"
                        >
                          Price on request
                        </Link>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Link
                          href={`/models/${vehicle.slug}`}
                          className="flex-1 bg-geely-blue text-white text-center font-semibold text-sm py-3 rounded hover:bg-opacity-90 transition-all"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/quote?model=${vehicle.id}`}
                          className="flex-1 border border-line text-navy text-center font-semibold text-sm py-3 rounded hover:bg-ice transition-all"
                        >
                          Get Quote
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Electric-specific Charging Section */}
      {isElectric && (
        <section className="py-16 bg-ice">
          <div className="max-w-[1280px] mx-auto px-10">
            <h2 className="text-3xl font-bold text-navy mb-8 text-center">
              Charging Made Easy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Charging Map */}
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="text-geely-blue" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Charging Network</h3>
                <p className="text-sm text-steel mb-4">
                  Find charging stations across Ethiopia. Our growing network ensures you're never far from a charge.
                </p>
                <a href="#" className="inline-flex items-center gap-2 text-geely-blue font-semibold text-sm hover:underline">
                  View Charging Map <ArrowRight size={16} />
                </a>
              </div>

              {/* Home Charging */}
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                  <Clock className="text-geely-blue" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Home Charging</h3>
                <p className="text-sm text-steel mb-4">
                  Install a home charger for convenient overnight charging. Full charge while you sleep.
                </p>
                <a href="#" className="inline-flex items-center gap-2 text-geely-blue font-semibold text-sm hover:underline">
                  Learn More <ArrowRight size={16} />
                </a>
              </div>

              {/* Fast Charging */}
              <div className="bg-white p-6 rounded-lg">
                <div className="w-12 h-12 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mb-4">
                  <Zap className="text-geely-blue" size={24} />
                </div>
                <h3 className="text-xl font-bold text-navy mb-3">Fast Charging</h3>
                <p className="text-sm text-steel mb-4">
                  DC fast charging gets you to 80% in just 30 minutes. Perfect for long journeys.
                </p>
                <a href="#" className="inline-flex items-center gap-2 text-geely-blue font-semibold text-sm hover:underline">
                  Find Fast Chargers <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="bg-gradient-to-r from-geely-blue to-blue-600 rounded-2xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience {category.name}?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Book a test drive or request a quote to get started with your next vehicle.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/test-drive"
                className="bg-white text-geely-blue font-bold text-base px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all"
              >
                Book Test Drive
              </Link>
              <Link
                href="/quote"
                className="border-2 border-white text-white font-bold text-base px-8 py-4 rounded-lg hover:bg-white hover:text-geely-blue transition-all"
              >
                Request Quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
