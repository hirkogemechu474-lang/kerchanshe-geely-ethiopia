'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Calculator, TrendingDown, Zap } from 'lucide-react';
import Link from 'next/link';

interface BenefitsPageData {
  title: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  description: string;
}

export default function CostCalculatorPage() {
  const [pageData, setPageData] = useState<BenefitsPageData | null>(null);
  const [fuelPrice, setFuelPrice] = useState(70); // ETB per liter
  const [electricityRate, setElectricityRate] = useState(3); // ETB per kWh
  const [monthlyKm, setMonthlyKm] = useState(1500);
  const [petrolConsumption] = useState(7); // km per liter (average car)
  const [evConsumption] = useState(5.5); // km per kWh (EX5 efficiency)

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await fetch('/api/public/electric/benefits/cost-calculator');
      if (response.ok) {
        const data = await response.json();
        setPageData(data.page);
      }
    } catch (error) {
      console.error('Error fetching page data:', error);
    }
  };

  // Calculate costs
  const petrolCost = (monthlyKm / petrolConsumption) * fuelPrice;
  const electricCost = (monthlyKm / evConsumption) * electricityRate;
  const monthlySavings = petrolCost - electricCost;
  const yearlySavings = monthlySavings * 12;

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 to-blue-600 text-white py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="max-w-2xl">
            <div className="text-sm tracking-widest font-bold mb-2 text-green-100">
              {pageData?.heroSubtitle || 'DISCOVER HOW MUCH YOU\'LL SAVE'}
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {pageData?.heroTitle || 'Calculate Your Savings'}
            </h1>
            <p className="text-lg text-green-50">
              {pageData?.description || 'See how much you can save by switching to an electric vehicle'}
            </p>
          </div>
        </div>
      </div>

      {/* Calculator Section */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Input Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-navy mb-6">Your Driving Profile</h3>

              <div className="space-y-6">
                {/* Monthly Kilometers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Kilometers
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={monthlyKm}
                    onChange={(e) => setMonthlyKm(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="mt-2 flex justify-between">
                    <span className="text-2xl font-bold text-navy">{monthlyKm.toLocaleString()} km</span>
                    <span className="text-sm text-steel">{(monthlyKm * 12).toLocaleString()} km/year</span>
                  </div>
                </div>

                {/* Fuel Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Petrol Price (ETB/liter)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="150"
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Electricity Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Electricity Rate (ETB/kWh)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Specs */}
              <div className="mt-8 p-4 bg-ice rounded-lg">
                <h4 className="font-bold text-navy mb-3">Vehicle Specs</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-steel">Petrol Car</div>
                    <div className="font-bold text-navy">{petrolConsumption} km/liter</div>
                  </div>
                  <div>
                    <div className="text-steel">Geometry EX5</div>
                    <div className="font-bold text-green-600">{evConsumption} km/kWh</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="space-y-6">
              {/* Monthly Comparison */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border-2 border-red-200 p-8">
                <h4 className="text-lg font-bold text-navy mb-4">Monthly Fuel Costs</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b-2 border-red-200">
                    <span className="text-steel">Petrol Vehicle</span>
                    <span className="text-2xl font-bold text-red-600">ETB {petrolCost.toFixed(0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-steel">Geometry EX5</span>
                    <span className="text-2xl font-bold text-green-600">ETB {electricCost.toFixed(0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Savings Card */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className="w-8 h-8" />
                  <h4 className="text-lg font-bold">Your Monthly Savings</h4>
                </div>
                <div className="text-4xl font-bold mb-2">
                  ETB {monthlySavings.toFixed(0).toLocaleString()}
                </div>
                <p className="text-green-100 text-sm mb-6">
                  Every month with the Geometry EX5
                </p>
                <div className="bg-white bg-opacity-20 rounded p-4">
                  <div className="text-sm text-green-100 mb-1">Annual Savings</div>
                  <div className="text-3xl font-bold">
                    ETB {yearlySavings.toFixed(0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Additional Benefits */}
              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Zap className="text-yellow-500 w-5 h-5" />
                    <div>
                      <div className="font-bold text-navy">Lower Maintenance</div>
                      <div className="text-xs text-steel">Save additional 30-40% on maintenance costs</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="text-blue-500 w-5 h-5" />
                    <div>
                      <div className="font-bold text-navy">Government Incentives</div>
                      <div className="text-xs text-steel">Additional tax benefits and subsidies available</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bg-navy text-white rounded-lg p-6 text-center">
                <h4 className="font-bold mb-2">Ready to save?</h4>
                <Link
                  href="/test-drive"
                  className="inline-block bg-geely-blue text-white px-6 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Book a Test Drive
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-10">
          <h2 className="text-3xl font-bold text-navy mb-8 text-center">Why These Costs Matter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-4xl font-bold text-green-600 mb-2">70%</div>
              <h4 className="font-bold text-navy mb-2">Lower Fuel Costs</h4>
              <p className="text-sm text-steel">
                Electricity is significantly cheaper than petrol, saving you money on every journey.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">30-40%</div>
              <h4 className="font-bold text-navy mb-2">Maintenance Savings</h4>
              <p className="text-sm text-steel">
                No oil changes, fewer moving parts, and advanced brake technology extend lifespan.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">8 Year</div>
              <h4 className="font-bold text-navy mb-2">Battery Warranty</h4>
              <p className="text-sm text-steel">
                Extended warranty covers battery replacement, protecting your investment.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
