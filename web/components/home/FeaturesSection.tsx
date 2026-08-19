'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Cpu, Star, DollarSign, CheckCircle, Zap, Award, Users } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: string;
  image: string;
}

const iconMap = {
  shield: Shield,
  cpu: Cpu,
  star: Star,
  dollar: DollarSign,
  check: CheckCircle,
  zap: Zap,
  award: Award,
  users: Users
};

export default function FeaturesSection() {
  const [features, setFeatures] = useState<Feature[]>([
    {
      title: 'Advanced Safety',
      description: '5-star safety rating with advanced driver assistance systems',
      icon: 'shield',
      image: ''
    },
    {
      title: 'Cutting-Edge Technology',
      description: 'Smart connectivity and intelligent driving features',
      icon: 'cpu',
      image: ''
    },
    {
      title: 'Exceptional Comfort',
      description: 'Premium interiors designed for ultimate comfort',
      icon: 'star',
      image: ''
    },
    {
      title: 'Competitive Pricing',
      description: 'Best value for money with flexible financing options',
      icon: 'dollar',
      image: ''
    }
  ]);

  useEffect(() => {
    // Fetch content from API
    fetch('/api/content/homepage')
      .then(res => res.json())
      .then(data => {
        if (data.features) {
          setFeatures(data.features);
        }
      })
      .catch(err => console.error('Failed to load features content:', err));
  }, []);

  return (
    <section className="py-16 bg-ice">
      <div className="max-w-[1280px] mx-auto px-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            Why Choose Geely
          </h2>
          <p className="text-lg text-steel max-w-2xl mx-auto">
            Experience the perfect blend of innovation, safety, and value that makes Geely the smart choice for Ethiopian drivers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon as keyof typeof iconMap] || Shield;
            
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Feature Image */}
                {feature.image ? (
                  <div className="w-full h-32 mb-4 rounded-lg overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-geely-blue/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-geely-blue/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-geely-blue" />
                  </div>
                )}

                {/* Feature Content */}
                <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-geely-blue transition-colors">
                  {feature.title}
                </h3>
                <p className="text-steel text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-steel mb-6">
            Ready to experience Geely excellence?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/models"
              className="inline-flex items-center justify-center bg-geely-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Explore Vehicles
            </Link>
            <a
              href="/test-drive"
              className="inline-flex items-center justify-center border border-geely-blue text-geely-blue font-bold px-8 py-3 rounded-lg hover:bg-geely-blue hover:text-white transition-colors"
            >
              Book Test Drive
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}