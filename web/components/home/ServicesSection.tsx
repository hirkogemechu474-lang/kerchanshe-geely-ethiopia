'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Car, Calendar, Calculator, RefreshCw, Wrench, Package, Shield, Phone } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

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

export default function ServicesSection() {
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/public/services/menu');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return <Car size={24} className="text-geely-blue" />;
    
    const IconComponent = (LucideIcons as any)[iconName] || iconMap[iconName];
    if (IconComponent) {
      return <IconComponent size={24} className="text-geely-blue" />;
    }
    return <Car size={24} className="text-geely-blue" />;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center">
            <div className="text-gray-500">Loading services...</div>
          </div>
        </div>
      </section>
    );
  }

  if (sections.length === 0) {
    return null;
  }

  // Get featured services from all sections
  const featuredServices = sections.reduce((acc: ServiceItem[], section) => {
    const sectionFeatured = section.items.filter(item => item.isFeatured);
    return [...acc, ...sectionFeatured];
  }, []);

  // If no featured services, take first few services
  const displayServices = featuredServices.length > 0 
    ? featuredServices.slice(0, 6) 
    : sections.reduce((acc: ServiceItem[], section) => [...acc, ...section.items], []).slice(0, 6);

  return (
    <section className="py-16 bg-ice">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-geely-blue/10 text-geely-blue px-4 py-2 rounded-full text-sm font-bold mb-4">
            OUR SERVICES
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-navy mb-4">
            Complete Automotive Solutions
          </h2>
          <p className="text-steel text-lg max-w-2xl mx-auto">
            From sales to service, we provide comprehensive support throughout your Geely ownership journey.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={service.url || '#'}
              className="group bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-line hover:border-geely-blue/30"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-geely-blue/10 rounded-lg group-hover:bg-geely-blue/20 transition-colors">
                  {getIcon(service.icon)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-navy text-lg mb-2 group-hover:text-geely-blue transition-colors">
                    {service.title}
                  </h3>
                  {service.description && (
                    <p className="text-steel text-sm mb-3 leading-relaxed">
                      {service.description}
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

        {/* Service Categories */}
        {sections.length > 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-xl p-8 border border-line">
                <h3 className="text-2xl font-bold text-navy mb-4">{section.title}</h3>
                <div className="space-y-3">
                  {section.items.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      href={item.url || '#'}
                      className="flex items-center gap-3 text-steel hover:text-geely-blue transition-colors group"
                    >
                      <div className="p-2 bg-gray-50 rounded group-hover:bg-geely-blue/10 transition-colors">
                        {getIcon(item.icon)}
                      </div>
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        {item.description && (
                          <div className="text-sm opacity-75">{item.description}</div>
                        )}
                      </div>
                      <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-navy text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
          >
            View All Services
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}