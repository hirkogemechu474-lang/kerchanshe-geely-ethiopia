'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Car, Calendar, Calculator, RefreshCw, Wrench, Package, Shield, Phone } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { getBreadcrumbSchema, getOrganizationSchema, getWebsiteSchema } from '@/lib/schema';

interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  url: string | null;
  isFeatured: boolean;
}

interface ServiceSection {
  id: string;
  title: string;
  slug: string;
  items: ServiceItem[];
}

const iconMap: { [key: string]: any } = {
  Car,
  Calendar,
  Calculator,
  RefreshCw,
  Wrench,
  Package,
  Shield,
  Phone,
};

export default function ServicesPage() {
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/services/menu')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setSections(data?.sections || []);
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
      })
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (iconName: string | null) => {
    if (!iconName) return <Car size={24} className="text-geely-blue" />;
    const IconComponent = (LucideIcons as any)[iconName] || iconMap[iconName];
    return IconComponent ? (
      <IconComponent size={24} className="text-geely-blue" />
    ) : (
      <Car size={24} className="text-geely-blue" />
    );
  };

  const allItems = sections.reduce((acc: ServiceItem[], section) => {
    return [...acc, ...section.items.filter((item) => item.url && item.url !== '#')];
  }, []);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: 'https://geelyethiopia.com' },
    { name: 'Services', url: 'https://geelyethiopia.com/services' },
  ]);

  return (
    <MainLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            getOrganizationSchema(),
            getWebsiteSchema(),
            breadcrumbSchema,
          ]),
        }}
      />

      {/* Page Hero */}
      <section className="bg-gradient-to-br from-navy via-[#123a72] to-geely-blue text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex items-center gap-2 text-[11px] tracking-wider mb-4 opacity-70">
            <Link href="/" className="hover:opacity-100 transition-opacity">
              Home
            </Link>
            <span>›</span>
            <span>Services</span>
          </div>
          <div className="inline-block bg-gold px-4 py-2 rounded-full text-sm font-bold tracking-wider mb-4 bg-gold/15 text-gold">
            OUR SERVICES
          </div>
          <h1 className="disp text-4xl md:text-5xl font-bold mb-4">
            Complete Automotive Solutions
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl leading-relaxed">
            From sales to service, we provide comprehensive support throughout your Geely ownership journey.
          </p>
        </div>
      </section>

      {/* Services Content */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4">
          {loading && (
            <div className="text-center py-12 text-steel">Loading services...</div>
          )}

          {!loading && sections.length === 0 && (
            <div className="text-center py-12 text-steel border border-dashed border-line rounded-xl">
              Services are managed from the admin panel.
            </div>
          )}

          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.id}>
                <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url || '#'}
                      className="group bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-line hover:border-geely-blue/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-geely-blue/10 rounded-lg group-hover:bg-geely-blue/20 transition-colors">
                          {getIcon(item.icon)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-navy text-lg mb-2 group-hover:text-geely-blue transition-colors">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-steel text-sm mb-3 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-geely-blue text-sm font-semibold">
                            Learn More
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-navy text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
            >
              Contact Our Team
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
