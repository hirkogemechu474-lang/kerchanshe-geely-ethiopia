"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import { MapPin, Zap, Clock, Battery, Home, Gauge, CheckCircle, Phone, Mail, Loader2 } from "lucide-react";
import Link from "next/link";

interface ChargingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  stationType: string;
  chargerCount: number;
  maxPower: string;
  connector: string[];
  availability: string;
  pricing: string | null;
  hours: string | null;
  amenities: string[] | null;
  images: string[] | null;
}

interface ElectricPage {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroImage: string | null;
  content: string | null;
  sections: any;
  metadata: any;
  chargingStations: ChargingStation[];
}

export default function ElectricPageDynamic() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [page, setPage] = useState<ElectricPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      try {
        const response = await fetch(`/api/public/electric/${slug}`);

        if (response.status === 404) {
          router.push('/404');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load page');
        }

        const data = await response.json();
        setPage(data.page);
      } catch (err) {
        console.error('Error fetching electric page:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [slug, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex items-center gap-3 text-steel">
            <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
            Loading page...
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !page) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-navy mb-4">Page Not Found</h1>
            <p className="text-steel mb-6">The page you're looking for doesn't exist.</p>
            <Link
              href="/electric"
              className="inline-block bg-geely-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90"
            >
              Back to Electric
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-navy text-white py-20">
        {page.heroImage && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={page.heroImage}
              alt={page.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative max-w-[1280px] mx-auto px-10">
          {page.heroSubtitle && (
            <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
              {page.heroSubtitle}
            </div>
          )}
          <h1 className="disp text-5xl font-bold mb-4">
            {page.heroTitle || page.title}
          </h1>
          {page.content && (
            <p className="text-[#d8e4f5] text-base max-w-2xl">
              {page.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
            </p>
          )}
        </div>
      </div>

      {/* Rich Content (admin-created pages) */}
      {page.content && (
        <section className="py-16">
          <div className="max-w-[1280px] mx-auto px-10">
            <div
              className="prose prose-lg max-w-none prose-headings:text-navy prose-p:text-steel prose-a:text-geely-blue prose-strong:text-navy prose-li:text-steel"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </section>
      )}

      {/* Page-specific sections */}
      {page.pageType === 'charging-map' && <ChargingMapContent page={page} />}
      {page.pageType === 'home-charging' && <HomeChargingContent page={page} />}
      {page.pageType === 'fast-charging' && <FastChargingContent page={page} />}

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 py-16">
        <div className="max-w-[1280px] mx-auto px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Go Electric?
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Explore our electric lineup and book a test drive today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/models"
              className="inline-flex items-center justify-center bg-gold text-navy px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
            >
              Explore Models
            </Link>
            <Link
              href="/test-drive"
              className="inline-flex items-center justify-center bg-white/10 text-white border border-white/30 px-8 py-4 rounded-lg font-bold hover:bg-white/20 transition-colors"
            >
              Book a Test Drive
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

// Charging Map Page Content
function ChargingMapContent({ page }: { page: ElectricPage }) {
  return (
    <section className="py-16">
      <div className="max-w-[1280px] mx-auto px-10">
        <h2 className="text-3xl font-bold text-navy mb-8">Charging Station Network</h2>

        {page.chargingStations.length === 0 ? (
          <div className="text-center py-12 bg-ice rounded-lg">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-steel text-lg">
              Charging stations will be listed here soon.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.chargingStations.map((station) => (
              <div key={station.id} className="bg-white rounded-lg border border-line p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-navy text-lg mb-1">{station.name}</h3>
                    <p className="text-sm text-steel">{station.city}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    station.availability === 'operational'
                      ? 'bg-green-100 text-green-700'
                      : station.availability === 'maintenance'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {station.availability}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-steel">
                    <MapPin size={16} />
                    <span>{station.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-steel">
                    <Zap size={16} className="text-geely-blue" />
                    <span>{station.maxPower} · {station.chargerCount} chargers</span>
                  </div>
                  {station.hours && (
                    <div className="flex items-center gap-2 text-sm text-steel">
                      <Clock size={16} />
                      <span>{station.hours}</span>
                    </div>
                  )}
                </div>

                {station.pricing && (
                  <div className="bg-ice p-3 rounded-lg text-sm">
                    <strong className="text-navy">Pricing:</strong> {station.pricing}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Home Charging Page Content
function HomeChargingContent({ page }: { page: ElectricPage }) {
  return (
    <section className="py-16">
      <div className="max-w-[1280px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-navy mb-6">Convenient Home Charging</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-navy">Overnight Charging</h3>
                  <p className="text-sm text-steel">Fully charge while you sleep</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-navy">Cost Effective</h3>
                  <p className="text-sm text-steel">Lower rates than public charging</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-bold text-navy">Professional Installation</h3>
                  <p className="text-sm text-steel">Expert installation service available</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-ice to-white p-8 rounded-lg">
            <Home className="w-16 h-16 text-geely-blue mb-4" />
            <h3 className="text-xl font-bold text-navy mb-4">Get Started</h3>
            <p className="text-steel text-sm mb-6">
              Contact us to schedule a home charging consultation and installation.
            </p>
            <div className="space-y-3">
              <a href="tel:+251110000000" className="flex items-center gap-2 text-geely-blue hover:underline">
                <Phone size={16} />
                +251 11 000 0000
              </a>
              <a href="mailto:charging@geelyethiopia.com" className="flex items-center gap-2 text-geely-blue hover:underline">
                <Mail size={16} />
                charging@geelyethiopia.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Fast Charging Page Content
function FastChargingContent({ page }: { page: ElectricPage }) {
  return (
    <>
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-geely-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-geely-blue" size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Ultra Fast</h3>
              <p className="text-steel text-sm">
                Up to 150kW DC fast charging for rapid top-ups
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Battery className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">30 Minutes</h3>
              <p className="text-steel text-sm">
                Charge from 20% to 80% in just 30 minutes
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gauge className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">Reliable</h3>
              <p className="text-steel text-sm">
                Premium charging hardware with 24/7 support
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
