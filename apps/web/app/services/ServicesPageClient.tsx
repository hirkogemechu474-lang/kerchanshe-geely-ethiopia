'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Car,
  Calculator,
  RefreshCw,
  Wrench,
  Package,
  Shield,
  ShieldCheck,
  MapPin,
  Phone,
  BadgeCheck,
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { getDealers, type Dealer } from '@/lib/api';

const ROADSIDE_HOTLINE = '+251 99 338 9874';
const ROADSIDE_HOTLINE_TEL = 'tel:+251993389874';

const HERO_IMAGE = '/uploads/seed/models/global/images/global-kv-1.jpg';
const BRAND_BANNER_IMAGE = '/uploads/seed/models/ex2/images/lifestyle/lifestyle-3.jpg';
const CTA_BACKGROUND_IMAGE = '/uploads/seed/models/ex2/images/lifestyle/lifestyle-1.jpg';

interface ServiceItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  url: string;
  cta: string;
}

interface ServiceSection {
  title: string;
  items: ServiceItem[];
}

const SECTIONS: ServiceSection[] = [
  {
    title: 'Sales & Ownership',
    items: [
      {
        title: 'Test Drive',
        description: 'Book a test drive at your nearest showroom and experience a Geely for yourself.',
        icon: Car,
        url: '/test-drive',
        cta: 'Book a Test Drive',
      },
      {
        title: 'Financing',
        description: 'Flexible bank financing plans and loan calculators tailored to your budget.',
        icon: Calculator,
        url: '/financing',
        cta: 'Explore Financing',
      },
      {
        title: 'Trade-In',
        description: 'Get a valuation for your current vehicle and trade it in toward a new Geely.',
        icon: RefreshCw,
        url: '/trade-in',
        cta: 'Value My Trade-In',
      },
      {
        title: 'Find a Dealer',
        description: 'Locate your nearest Geely showroom or service center across Ethiopia.',
        icon: MapPin,
        url: '/dealers',
        cta: 'Find a Location',
      },
    ],
  },
  {
    title: 'After-Sales & Support',
    items: [
      {
        title: 'Book a Service',
        description: 'Schedule maintenance, repairs, and inspections with our certified technicians.',
        icon: Wrench,
        url: '/service',
        cta: 'Schedule Service',
      },
      {
        title: 'Genuine Spare Parts',
        description: 'Order genuine Geely parts and accessories for your vehicle.',
        icon: Package,
        url: '/parts',
        cta: 'Shop Spare Parts',
      },
      {
        title: 'Warranty',
        description: "Review your vehicle's warranty coverage and service history.",
        icon: Shield,
        url: '/warranty',
        cta: 'View Warranty',
      },
      {
        title: 'Roadside Assistance',
        description: '24/7 roadside support nationwide, wherever the road takes you.',
        icon: ShieldCheck,
        url: '/roadside',
        cta: 'Learn More',
      },
    ],
  },
];

const TRUST_STATS = [
  { icon: BadgeCheck, label: '100% Certified Technicians' },
  { icon: Package, label: 'Genuine Geely Parts Only' },
  { icon: Shield, label: '5-Year / 150,000 km Warranty' },
  { icon: ShieldCheck, label: '24/7 Roadside Assistance' },
];

function dealerLocationLabel(dealer: Dealer): string {
  return dealer.address?.city || dealer.city || dealer.address?.area || dealer.address?.region || '';
}

export function ServicesPageClient() {
  const [serviceCenters, setServiceCenters] = useState<Dealer[]>([]);

  useEffect(() => {
    getDealers()
      .then((dealers) => {
        const centers = dealers.filter((d) => d.type === 'service' || d.type === 'both' || !d.type);
        setServiceCenters(centers.length > 0 ? centers : dealers);
      })
      .catch((error) => {
        console.error('Failed to fetch service centers:', error);
      });
  }, []);

  return (
    <MainLayout>
      {/* Page Hero */}
      <section className="relative overflow-hidden text-white py-24">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/40" />
        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-center gap-2 text-[11px] tracking-wider mb-4 opacity-70">
            <Link href="/" className="hover:opacity-100 transition-opacity">
              Home
            </Link>
            <span>›</span>
            <span>Services</span>
          </div>
          <div className="inline-block px-4 py-2 rounded-full text-sm font-bold tracking-wider mb-4 bg-gold/15 text-gold">
            OUR SERVICES
          </div>
          <h1 className="disp text-4xl md:text-5xl font-bold mb-4">
            Complete Automotive Solutions
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl leading-relaxed mb-8">
            From sales to service, we provide comprehensive support throughout your Geely ownership journey.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/service"
              className="inline-flex items-center gap-2 bg-white text-navy px-6 py-3.5 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
            >
              <Wrench size={18} />
              Book a Service
            </Link>
            <a
              href={ROADSIDE_HOTLINE_TEL}
              className="inline-flex items-center gap-2 border border-white/40 text-white px-6 py-3.5 font-bold hover:bg-white/10 transition-colors"
            >
              <Phone size={18} />
              Call Us: {ROADSIDE_HOTLINE}
            </a>
          </div>
        </div>
      </section>

      {/* Trust / Certified band */}
      <section className="bg-white dark:bg-midnight-surface border-b border-line dark:border-midnight-line">
        <div className="max-w-[1280px] mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_STATS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="p-2.5 bg-geely-blue/10 rounded-lg shrink-0">
                <Icon size={20} className="text-geely-blue" />
              </div>
              <span className="text-sm font-semibold text-navy dark:text-ice leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services Content */}
      <section className="py-16 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="space-y-12">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-ice mb-6">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.title}
                        href={item.url}
                        className="group bg-white dark:bg-midnight-surface rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-line dark:border-midnight-line hover:border-geely-blue/30 flex flex-col"
                      >
                        <div className="p-3 bg-geely-blue/10 rounded-lg group-hover:bg-geely-blue/20 transition-colors w-fit mb-4">
                          <Icon size={24} className="text-geely-blue" />
                        </div>
                        <h3 className="font-bold text-navy dark:text-ice text-lg mb-2 group-hover:text-geely-blue transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-steel dark:text-steel-light text-sm mb-4 leading-relaxed flex-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-geely-blue text-sm font-semibold">
                          {item.cta}
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Banner */}
      <section className="relative w-full aspect-[21/9] md:aspect-[3/1] overflow-hidden">
        <Image
          src={BRAND_BANNER_IMAGE}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
          <p className="text-white font-bold text-xl md:text-3xl max-w-lg">
            Genuine care, wherever the road takes you.
          </p>
        </div>
      </section>

      {/* Service Center Locator */}
      {serviceCenters.length > 0 && (
        <section className="py-16 bg-white dark:bg-midnight-surface">
          <div className="max-w-[1280px] mx-auto px-4">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-ice mb-2">
                  Our Locations Across Ethiopia
                </h2>
                <p className="text-steel dark:text-steel-light">
                  Find your nearest showroom or service center.
                </p>
              </div>
              <Link
                href="/dealers"
                className="inline-flex items-center gap-2 text-geely-blue font-semibold hover:underline"
              >
                View All Locations
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {serviceCenters.slice(0, 3).map((dealer) => (
                <div
                  key={dealer.id}
                  className="rounded-xl p-6 border border-line dark:border-midnight-line bg-ice dark:bg-midnight"
                >
                  <div className="flex items-center gap-2 text-geely-blue mb-2">
                    <MapPin size={18} />
                    <span className="text-xs font-bold tracking-wider uppercase">
                      {dealerLocationLabel(dealer) || 'Ethiopia'}
                    </span>
                  </div>
                  <h3 className="font-bold text-navy dark:text-ice text-lg mb-1">{dealer.name}</h3>
                  {dealer.address?.street && (
                    <p className="text-steel dark:text-steel-light text-sm mb-3">{dealer.address.street}</p>
                  )}
                  {dealer.phone && (
                    <a
                      href={`tel:${dealer.phone}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-navy dark:text-ice hover:text-geely-blue"
                    >
                      <Phone size={14} />
                      {dealer.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="relative overflow-hidden text-white py-16">
        <Image
          src={CTA_BACKGROUND_IMAGE}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative max-w-[1280px] mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready When You Are</h2>
          <p className="text-[#d8e4f5] max-w-xl mx-auto mb-8">
            Book a service appointment online, or reach our team directly for anything else.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/service"
              className="inline-flex items-center gap-2 bg-white text-navy px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
            >
              Book a Service
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-8 py-4 font-bold hover:bg-white/10 transition-colors"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
