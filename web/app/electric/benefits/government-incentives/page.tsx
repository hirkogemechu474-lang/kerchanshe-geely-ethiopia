'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CheckCircle, TrendingUp, Award, Shield } from 'lucide-react';
import Link from 'next/link';

interface BenefitsPageData {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  description: string;
}

export default function GovernmentIncentivesPage() {
  const [pageData, setPageData] = useState<BenefitsPageData | null>(null);

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await fetch('/api/public/electric/benefits/government-incentives');
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
      <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="max-w-2xl">
            <div className="text-sm tracking-widest font-bold mb-2 text-blue-100">
              {pageData?.heroSubtitle || 'TAX BENEFITS AND SUBSIDIES'}
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {pageData?.heroTitle || 'Government Incentives & Support'}
            </h1>
            <p className="text-lg text-blue-50">
              {pageData?.description || 'The Ethiopian government supports the transition to electric vehicles'}
            </p>
          </div>
        </div>
      </div>

      {/* Current Incentives */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">Current Incentives</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Reduced Import Duty */}
            <div className="bg-white rounded-lg border-2 border-green-500 p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-green-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy">Reduced Import Duty</h3>
              </div>
              <p className="text-steel mb-4">
                Electric vehicles benefit from reduced import tariffs as part of Ethiopia's commitment to sustainable transportation.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li className="flex gap-2">
                  <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Lower import taxes on EV units</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Reduces vehicle acquisition cost</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-green-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Makes EVs more affordable</span>
                </li>
              </ul>
            </div>

            {/* Lower Registration Fees */}
            <div className="bg-white rounded-lg border-2 border-blue-500 p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Award className="text-blue-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy">Lower Registration Fees</h3>
              </div>
              <p className="text-steel mb-4">
                Electric vehicles enjoy reduced annual registration and licensing fees compared to traditional vehicles.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li className="flex gap-2">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Reduced annual registration costs</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Lower road tax rates</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-blue-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Ongoing cost savings</span>
                </li>
              </ul>
            </div>

            {/* Priority Parking */}
            <div className="bg-white rounded-lg border-2 border-purple-500 p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="text-purple-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy">Priority Parking</h3>
              </div>
              <p className="text-steel mb-4">
                Dedicated EV parking spaces at major public facilities and private establishments.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li className="flex gap-2">
                  <CheckCircle className="text-purple-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Reserved parking at malls</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-purple-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Government facilities</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-purple-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Convenient charging access</span>
                </li>
              </ul>
            </div>

            {/* Future Benefits */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-500 p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-orange-600 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-navy">Future Incentives</h3>
              </div>
              <p className="text-steel mb-4">
                As part of Ethiopia's Vision 2030, additional incentives are being planned.
              </p>
              <ul className="space-y-2 text-sm text-steel">
                <li className="flex gap-2">
                  <CheckCircle className="text-orange-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Tax exemptions (under consideration)</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-orange-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Subsidized charging infrastructure</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="text-orange-600 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Electric public transport fleet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How to Qualify */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">How to Qualify</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-geely-blue text-white text-lg font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-navy mb-2">Purchase an Electric Vehicle</h4>
                  <p className="text-steel">
                    Buy an eligible electric vehicle from an authorized Geely dealer in Ethiopia.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-geely-blue text-white text-lg font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-navy mb-2">Complete Registration</h4>
                  <p className="text-steel">
                    Register your vehicle with the Transport Authority with proper documentation.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-geely-blue text-white text-lg font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-navy mb-2">Claim Incentives</h4>
                  <p className="text-steel">
                    Submit required documents to claim applicable tax benefits and fee reductions.
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-geely-blue text-white text-lg font-bold">
                    4
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-navy mb-2">Enjoy Benefits</h4>
                  <p className="text-steel">
                    Access all government and private sector incentives for EV owners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-bold text-navy mb-2">Who is eligible for these incentives?</h4>
              <p className="text-sm text-steel">
                Any individual or business that purchases and registers an electric vehicle in Ethiopia is eligible for government incentives.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-bold text-navy mb-2">How much can I save with these incentives?</h4>
              <p className="text-sm text-steel">
                Savings depend on vehicle price and local tax rates. On average, customers save 5-10% on vehicle costs through reduced import duties and registration fees.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-bold text-navy mb-2">Are there any income requirements?</h4>
              <p className="text-sm text-steel">
                No income requirements for current incentives. However, some future subsidized financing options may have income criteria.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-bold text-navy mb-2">How do I apply for these incentives?</h4>
              <p className="text-sm text-steel">
                Contact your Geely dealer for guidance. We can help you with all necessary documentation and procedures to claim applicable incentives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-[1280px] mx-auto px-10 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Go Electric?</h3>
          <p className="text-lg text-blue-50 mb-8 max-w-2xl mx-auto">
            Take advantage of government incentives and switch to sustainable transportation today.
          </p>
          <Link
            href="/test-drive"
            className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Book Your Test Drive
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
