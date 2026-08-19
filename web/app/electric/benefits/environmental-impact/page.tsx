'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Leaf, Wind, Droplet, Zap, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface BenefitsPageData {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  description: string;
}

export default function EnvironmentalImpactPage() {
  const [pageData, setPageData] = useState<BenefitsPageData | null>(null);

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await fetch('/api/public/electric/benefits/environmental-impact');
      if (response.ok) {
        const data = await response.json();
        setPageData(data.page);
      }
    } catch (error) {
      console.error('Error fetching page data:', error);
    }
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 to-emerald-600 text-white py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="max-w-2xl">
            <div className="text-sm tracking-widest font-bold mb-2 text-green-100">
              {pageData?.heroSubtitle || 'ENVIRONMENTAL BENEFITS'}
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {pageData?.heroTitle || 'Reduce Your Carbon Footprint'}
            </h1>
            <p className="text-lg text-green-50">
              {pageData?.description || 'Make a positive impact on Ethiopia\'s environment with electric vehicles'}
            </p>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">Environmental Benefits</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="text-red-600 w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-navy mb-2">0</div>
              <h4 className="font-bold text-navy mb-2">Emissions</h4>
              <p className="text-sm text-steel">
                Zero tailpipe emissions during operation
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Leaf className="text-green-600 w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-navy mb-2">60 tons</div>
              <h4 className="font-bold text-navy mb-2">CO2 Reduction</h4>
              <p className="text-sm text-steel">
                Over a 10-year lifetime vs. petrol cars
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wind className="text-blue-600 w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-navy mb-2">80%</div>
              <h4 className="font-bold text-navy mb-2">Air Quality</h4>
              <p className="text-sm text-steel">
                Reduced air pollutants in cities
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-lg">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplet className="text-cyan-600 w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-navy mb-2">100%</div>
              <h4 className="font-bold text-navy mb-2">Clean</h4>
              <p className="text-sm text-steel">
                No oil or fluid leaks into soil/water
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Environmental Comparison */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">Geometry EX5 vs. Petrol Vehicle</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CO2 Emissions */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h4 className="text-xl font-bold text-navy mb-6">Annual CO2 Emissions (15,000 km)</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-steel">Petrol Vehicle</span>
                    <span className="font-bold text-navy">3.5 tons</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-steel">Geometry EX5 (Grid Mix)</span>
                    <span className="font-bold text-green-600">0.8 tons</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-bold text-navy">Annual Reduction</span>
                    <span className="text-2xl font-bold text-green-600">77%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Air Pollutants */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h4 className="text-xl font-bold text-navy mb-6">Air Pollutants (NOx & PM2.5)</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-steel">Petrol Vehicle</span>
                    <span className="font-bold text-navy">4.2 kg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-steel">Geometry EX5</span>
                    <span className="font-bold text-green-600">0 kg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-bold text-navy">Reduction</span>
                    <span className="text-2xl font-bold text-green-600">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Bigger Picture */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">The Bigger Picture</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Air Quality */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Wind className="text-blue-600 w-6 h-6" />
                <h4 className="text-xl font-bold text-navy">Air Quality Improvement</h4>
              </div>
              <p className="text-steel mb-4">
                If 50% of Addis Ababa's vehicles were electric:
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>87.5 million tons of CO2 prevented annually</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Major reduction in respiratory diseases</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Cleaner air for children and elderly</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Lower healthcare costs</span>
                </li>
              </ul>
            </div>

            {/* Climate Action */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Leaf className="text-green-600 w-6 h-6" />
                <h4 className="text-xl font-bold text-navy">Climate Action</h4>
              </div>
              <p className="text-steel mb-4">
                Ethiopia's commitment to sustainability:
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Carbon-neutral transport by 2050</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Leverage renewable energy (hydro, solar)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Support global climate targets</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>Create sustainable jobs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Recycling & Sustainability */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">End-of-Life Sustainability</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h4 className="text-xl font-bold text-navy mb-6">Battery Recycling Program</h4>
              <p className="text-steel mb-4">
                Our batteries don't just disappear. Geely has established a comprehensive recycling program:
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 font-bold">
                      1
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-navy mb-1">Battery Collection</h5>
                    <p className="text-sm text-steel">
                      End-of-life batteries are collected from service centers and recycling partners.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 font-bold">
                      2
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-navy mb-1">Safe Recycling</h5>
                    <p className="text-sm text-steel">
                      Batteries are recycled using environmentally safe processes to recover materials.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 font-bold">
                      3
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-navy mb-1">Material Recovery</h5>
                    <p className="text-sm text-steel">
                      80-90% of battery materials (lithium, cobalt, nickel) are recovered and reused.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 font-bold">
                      4
                    </div>
                  </div>
                  <div>
                    <h5 className="font-bold text-navy mb-1">Zero Waste Goal</h5>
                    <p className="text-sm text-steel">
                      Working toward zero-waste manufacturing and complete battery lifecycle management.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Impact */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">Your Personal Impact</h2>
          
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-lg p-12 text-center">
            <h4 className="text-2xl font-bold mb-6">By choosing a Geometry EX5</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-4xl font-bold mb-2">6 tons</div>
                <p className="text-green-100">CO2 prevented annually</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">500 liters</div>
                <p className="text-green-100">Petrol not burned annually</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100%</div>
                <p className="text-green-100">Zero tailpipe emissions</p>
              </div>
            </div>

            <p className="text-green-100 mb-8 max-w-2xl mx-auto">
              Over a 10-year period, a single Geometry EX5 prevents approximately 60 tons of CO2 emissions and reduces air pollution significantly in your community.
            </p>

            <Link
              href="/test-drive"
              className="inline-block bg-white text-green-600 font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Be Part of the Solution
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
