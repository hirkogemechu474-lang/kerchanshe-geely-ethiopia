'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/MainLayout';
import {
  Calculator,
  DollarSign,
  PiggyBank,
  TrendingDown,
  Leaf,
  Fuel,
  Zap,
  Car,
  Clock,
  ShieldCheck,
  Wrench,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const formatETB = (value: number): string => {
  return `ETB ${Math.round(value).toLocaleString('en-ET')}`;
};

const formatNumber = (value: number): string => {
  return Math.round(value).toLocaleString('en-ET');
};

const DEFAULT_CONFIG = {
  defaults: {
    monthlyDistance: 1500,
    fuelPrice: 70,
    electricityCost: 3,
    petrolEfficiency: 12,
    evEfficiency: 6,
  },
  faqs: [
    {
      q: 'How are the annual fuel costs calculated?',
      a: 'Annual fuel costs are calculated by taking your monthly driving distance, multiplying by 12 to get annual distance, then dividing by your petrol vehicle efficiency (km/l) to get total liters consumed per year, and finally multiplying by the current fuel price per liter.',
    },
    {
      q: 'Why is electricity so much cheaper than petrol?',
      a: 'Electric motors are far more efficient than internal combustion engines — typically 85-90% efficient vs 20-30% for petrol engines. Additionally, electricity tariffs in Ethiopia are heavily subsidized and stable compared to volatile global oil prices.',
    },
    {
      q: 'How realistic is the 5-year and 8-year savings projection?',
      a: 'These projections assume fuel prices and electricity rates remain at their current levels. Historically, fuel prices have tended to rise over time, meaning your actual savings could be even higher. Maintenance savings are not included in these figures — they would add further to your total savings.',
    },
    {
      q: 'How is CO2 emissions reduction calculated?',
      a: 'CO2 savings are calculated using the standard emission factor of 2.31 kg of CO2 per liter of petrol burned. This represents the amount of CO2 that would have been released into the atmosphere if you drove the same distance using a petrol vehicle.',
    },
    {
      q: 'What maintenance savings can I expect with an EV?',
      a: 'Electric vehicles have significantly fewer moving parts. You save on oil changes (typically every 5,000-10,000 km), spark plug replacements, timing belts, exhaust systems, transmission fluid, and more. Regenerative braking also extends brake pad life by 2-3 times. Total maintenance savings typically range from ETB 15,000 to ETB 30,000 per year.',
    },
    {
      q: 'Do electricity tariffs vary across Ethiopia?',
      a: 'Yes, electricity tariffs can vary slightly by region and consumption tier. The default 3 ETB/kWh is based on the average domestic tariff for households. Commercial rates may differ. Ethiopian Electric Utility periodically reviews tariffs, but increases have historically been modest compared to fuel price hikes.',
    },
  ],
};

export default function CalculatorPage() {
  const [monthlyDistance, setMonthlyDistance] = useState(DEFAULT_CONFIG.defaults.monthlyDistance);
  const [fuelPrice, setFuelPrice] = useState(DEFAULT_CONFIG.defaults.fuelPrice);
  const [electricityCost, setElectricityCost] = useState(DEFAULT_CONFIG.defaults.electricityCost);
  const [petrolEfficiency, setPetrolEfficiency] = useState(DEFAULT_CONFIG.defaults.petrolEfficiency);
  const [evEfficiency, setEvEfficiency] = useState(DEFAULT_CONFIG.defaults.evEfficiency);
  const [faqs, setFaqs] = useState(DEFAULT_CONFIG.faqs);
  const [hero, setHero] = useState({
    title: 'Calculate Your EV Savings',
    subtitle: 'COST COMPARISON TOOL',
    description:
      'Discover how much you could save annually by switching from a petrol vehicle to a Geely Electric Vehicle. Adjust the sliders below to match your driving profile and see the difference in real-time.',
  });
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Load editable config from the admin-managed ElectricPage (slug: cost-calculator)
  useEffect(() => {
    fetch('/api/public/electric/benefits/cost-calculator')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.page) return;
        const meta =
          typeof data.page.metadata === 'string'
            ? JSON.parse(data.page.metadata)
            : data.page.metadata || {};
        const calc = meta.calculator || {};

        if (calc.defaults) {
          if (typeof calc.defaults.monthlyDistance === 'number') {
            setMonthlyDistance(calc.defaults.monthlyDistance);
          }
          if (typeof calc.defaults.fuelPrice === 'number') {
            setFuelPrice(calc.defaults.fuelPrice);
          }
          if (typeof calc.defaults.electricityCost === 'number') {
            setElectricityCost(calc.defaults.electricityCost);
          }
          if (typeof calc.defaults.petrolEfficiency === 'number') {
            setPetrolEfficiency(calc.defaults.petrolEfficiency);
          }
          if (typeof calc.defaults.evEfficiency === 'number') {
            setEvEfficiency(calc.defaults.evEfficiency);
          }
        }
        if (Array.isArray(calc.faqs) && calc.faqs.length > 0) {
          setFaqs(calc.faqs);
        }
        if (data.page.heroTitle || data.page.heroSubtitle || data.page.content) {
          setHero({
            title: data.page.heroTitle || hero.title,
            subtitle: data.page.heroSubtitle || hero.subtitle,
            description: data.page.content || hero.description,
          });
        }
      })
      .catch((err) => console.error('Failed to load calculator config:', err));
  }, []);

  const calculations = useMemo(() => {
    const annualDistance = monthlyDistance * 12;

    const annualFuelLiters = annualDistance / petrolEfficiency;
    const annualFuelCost = annualFuelLiters * fuelPrice;

    const annualElectricityKWh = annualDistance / evEfficiency;
    const annualElectricityCost = annualElectricityKWh * electricityCost;

    const annualSavings = annualFuelCost - annualElectricityCost;
    const fiveYearSavings = annualSavings * 5;
    const eightYearSavings = annualSavings * 8;

    const co2PerLiter = 2.31;
    const annualCO2Saved = annualFuelLiters * co2PerLiter;

    return {
      annualDistance,
      annualFuelLiters,
      annualFuelCost,
      annualElectricityKWh,
      annualElectricityCost,
      annualSavings,
      fiveYearSavings,
      eightYearSavings,
      annualCO2Saved,
    };
  }, [monthlyDistance, fuelPrice, electricityCost, petrolEfficiency, evEfficiency]);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-green-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Calculator className="w-9 h-9" />
              </div>
            </div>
            <div className="text-[13px] tracking-[0.18em] text-green-100 font-bold mb-4 uppercase">
              {hero.subtitle}
            </div>
            <h1 className="disp text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              {hero.title}
            </h1>
            <p className="text-lg text-green-50 leading-relaxed max-w-2xl">
              {hero.description}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Calculator */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Input Panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-line shadow-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-navy">Your Driving Profile</h2>
                  <p className="text-sm text-steel">Customize the values below</p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Monthly Distance */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-navy">
                      Monthly Distance
                    </label>
                    <div className="text-right">
                      <div className="text-xl font-bold text-navy">{formatNumber(monthlyDistance)} km</div>
                      <div className="text-xs text-steel">{formatNumber(calculations.annualDistance)} km/year</div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={50}
                    value={monthlyDistance}
                    onChange={(e) => setMonthlyDistance(Number(e.target.value))}
                    className="w-full h-2 bg-ice rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2 text-xs text-steel">
                    <span>100 km</span>
                    <span>5,000 km</span>
                  </div>
                </div>

                {/* Fuel Price */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-navy">
                      Fuel Price per Liter
                    </label>
                    <div className="text-xl font-bold text-navy">{formatETB(fuelPrice)}</div>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={150}
                    step={1}
                    value={fuelPrice}
                    onChange={(e) => setFuelPrice(Number(e.target.value))}
                    className="w-full h-2 bg-ice rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2 text-xs text-steel">
                    <span>30 ETB</span>
                    <span>150 ETB</span>
                  </div>
                </div>

                {/* Electricity Cost */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-navy">
                      Electricity Cost per kWh
                    </label>
                    <div className="text-xl font-bold text-navy">{formatETB(electricityCost)}</div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    step={0.5}
                    value={electricityCost}
                    onChange={(e) => setElectricityCost(Number(e.target.value))}
                    className="w-full h-2 bg-ice rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2 text-xs text-steel">
                    <span>1 ETB</span>
                    <span>15 ETB</span>
                  </div>
                </div>

                {/* Petrol Efficiency */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-navy">
                      Petrol Vehicle Efficiency
                    </label>
                    <div className="text-xl font-bold text-navy">{petrolEfficiency} km/l</div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    step={1}
                    value={petrolEfficiency}
                    onChange={(e) => setPetrolEfficiency(Number(e.target.value))}
                    className="w-full h-2 bg-ice rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2 text-xs text-steel">
                    <span>5 km/l</span>
                    <span>25 km/l</span>
                  </div>
                </div>

                {/* EV Efficiency */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-semibold text-navy">
                      EV Efficiency
                    </label>
                    <div className="text-xl font-bold text-navy">{evEfficiency} km/kWh</div>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={0.5}
                    value={evEfficiency}
                    onChange={(e) => setEvEfficiency(Number(e.target.value))}
                    className="w-full h-2 bg-ice rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between mt-2 text-xs text-steel">
                    <span>3 km/kWh</span>
                    <span>12 km/kWh</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Annual Cost Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border-2 border-red-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <Fuel className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-sm font-semibold text-steel">Annual Fuel Cost (Petrol)</div>
                  </div>
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {formatETB(calculations.annualFuelCost)}
                  </div>
                  <div className="text-sm text-steel">
                    {formatNumber(calculations.annualFuelLiters)} liters consumed per year
                  </div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-emerald-100 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-sm font-semibold text-steel">Annual Electricity Cost (EV)</div>
                  </div>
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {formatETB(calculations.annualElectricityCost)}
                  </div>
                  <div className="text-sm text-steel">
                    {formatNumber(calculations.annualElectricityKWh)} kWh consumed per year
                  </div>
                </div>
              </div>

              {/* Annual Savings Highlight */}
              <div className="bg-gradient-to-br from-emerald-600 to-green-700 text-white rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className="w-8 h-8" />
                  <div className="text-lg font-bold tracking-wide uppercase text-green-100">
                    Annual Savings
                  </div>
                </div>
                <div className="text-5xl sm:text-6xl font-bold mb-4">
                  {formatETB(calculations.annualSavings)}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-green-50 leading-relaxed">
                    That's how much less you'll spend on energy alone each year with a Geely EV.
                  </p>
                  <div className="flex items-center gap-2 bg-white/15 rounded-xl px-5 py-3 backdrop-blur-sm">
                    <Leaf className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-green-100 font-semibold uppercase">CO₂ Saved / Year</div>
                      <div className="text-2xl font-bold">{formatNumber(calculations.annualCO2Saved)} kg</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Long Term Projections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-navy" />
                    <div className="text-sm font-semibold text-steel">5-Year Total Savings</div>
                  </div>
                  <div className="text-4xl font-bold text-navy">
                    {formatETB(calculations.fiveYearSavings)}
                  </div>
                  <div className="mt-3 h-2 bg-ice rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" style={{ width: '62.5%' }} />
                  </div>
                  <div className="mt-2 text-xs text-steel">62.5% of 8-year horizon</div>
                </div>

                <div className="bg-white rounded-2xl border-2 border-gold/40 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="w-5 h-5 text-gold" />
                    <div className="text-sm font-semibold text-steel">8-Year Total Savings</div>
                  </div>
                  <div className="text-4xl font-bold text-navy">
                    {formatETB(calculations.eightYearSavings)}
                  </div>
                  <div className="mt-3 h-2 bg-gold/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold to-yellow-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <div className="mt-2 text-xs text-steel">Full EV warranty period coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Content Sections */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-14">
            <div className="text-[13px] tracking-[0.18em] text-emerald-600 font-bold mb-4 uppercase">
              Understanding Your Savings
            </div>
            <h2 className="disp text-3xl sm:text-4xl font-bold text-navy mb-4">
              The Economics of Electric Driving
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Break down exactly where your savings come from and why switching to electric makes long-term financial sense for Ethiopian drivers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 1 - Fuel Cost Breakdown */}
            <div className="bg-white rounded-2xl border border-line p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Fuel Cost Breakdown</h3>
              <p className="text-steel leading-relaxed mb-6">
                At your current driving pace, a petrol vehicle consumes approximately <strong>{formatNumber(calculations.annualFuelLiters)} liters</strong> of fuel annually.
                At current pump prices, this adds up to a significant annual expense that only increases as fuel prices rise.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Monthly fuel bill</span>
                  <span className="font-bold text-red-600">{formatETB(calculations.annualFuelCost / 12)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Cost per kilometer</span>
                  <span className="font-bold text-red-600">
                    ETB {(fuelPrice / petrolEfficiency).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-steel">Weekly fuel spend</span>
                  <span className="font-bold text-red-600">{formatETB(calculations.annualFuelCost / 52)}</span>
                </div>
              </div>
            </div>

            {/* Section 2 - Electricity Cost Analysis */}
            <div className="bg-white rounded-2xl border border-line p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Electricity Cost Analysis</h3>
              <p className="text-steel leading-relaxed mb-6">
                Electric vehicles convert energy far more efficiently. The same annual distance requires only
                <strong> {formatNumber(calculations.annualElectricityKWh)} kWh</strong> of electricity —
                dramatically cheaper per kilometer than petrol.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Monthly electricity bill</span>
                  <span className="font-bold text-emerald-600">{formatETB(calculations.annualElectricityCost / 12)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Cost per kilometer</span>
                  <span className="font-bold text-emerald-600">
                    ETB {(electricityCost / evEfficiency).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-steel">Weekly charging cost</span>
                  <span className="font-bold text-emerald-600">{formatETB(calculations.annualElectricityCost / 52)}</span>
                </div>
              </div>
            </div>

            {/* Section 3 - Long-Term Savings */}
            <div className="bg-white rounded-2xl border border-line p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <PiggyBank className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Long-Term Savings Projections</h3>
              <p className="text-steel leading-relaxed mb-6">
                Your savings compound year after year. Within the 8-year EV battery warranty period, you could save enough to cover a significant portion of the vehicle cost or fund other major life expenses.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Year 1 savings</span>
                  <span className="font-bold text-blue-600">{formatETB(calculations.annualSavings)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Year 5 cumulative</span>
                  <span className="font-bold text-blue-600">{formatETB(calculations.fiveYearSavings)}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-steel">Year 8 cumulative</span>
                  <span className="font-bold text-gold">{formatETB(calculations.eightYearSavings)}</span>
                </div>
              </div>
            </div>

            {/* Section 4 - Maintenance Savings */}
            <div className="bg-white rounded-2xl border border-line p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                <Wrench className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Maintenance Savings</h3>
              <p className="text-steel leading-relaxed mb-6">
                Beyond fuel savings, EVs dramatically reduce maintenance costs. No oil changes, no spark plugs, no timing belts, and regenerative braking extends brake pad life by 2-3 times.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Oil changes (4x/yr)</span>
                  <span className="font-bold text-purple-600">~ ETB 8,000 - 12,000 saved</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-line">
                  <span className="text-sm text-steel">Brake pads & parts</span>
                  <span className="font-bold text-purple-600">~ ETB 5,000 - 10,000 saved</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-sm text-steel">Estimated total/year</span>
                  <span className="font-bold text-purple-600">~ ETB 15,000 - 30,000 saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-14">
            <div className="text-[13px] tracking-[0.18em] text-emerald-600 font-bold mb-4 uppercase">
              Side-by-Side Comparison
            </div>
            <h2 className="disp text-3xl sm:text-4xl font-bold text-navy mb-4">
              Petrol Vehicle vs Electric Vehicle
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              A comprehensive look at the true cost of ownership based on your driving profile above.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="text-left px-6 sm:px-8 py-5 font-bold text-sm sm:text-base">Cost Category</th>
                    <th className="text-center px-4 sm:px-8 py-5 font-bold text-sm sm:text-base">
                      <div className="flex items-center justify-center gap-2">
                        <Car className="w-5 h-5 text-red-300" />
                        Petrol Vehicle
                      </div>
                    </th>
                    <th className="text-center px-4 sm:px-8 py-5 font-bold text-sm sm:text-base bg-emerald-700">
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-200" />
                        Geely Electric
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      category: 'Annual Fuel / Energy Cost',
                      petrol: formatETB(calculations.annualFuelCost),
                      ev: formatETB(calculations.annualElectricityCost),
                      highlight: true,
                    },
                    {
                      category: 'Cost per Kilometer',
                      petrol: `ETB ${(fuelPrice / petrolEfficiency).toFixed(2)}`,
                      ev: `ETB ${(electricityCost / evEfficiency).toFixed(2)}`,
                      highlight: false,
                    },
                    {
                      category: 'Monthly Running Cost (Fuel)',
                      petrol: formatETB(calculations.annualFuelCost / 12),
                      ev: formatETB(calculations.annualElectricityCost / 12),
                      highlight: false,
                    },
                    {
                      category: '5-Year Fuel / Energy',
                      petrol: formatETB(calculations.annualFuelCost * 5),
                      ev: formatETB(calculations.annualElectricityCost * 5),
                      highlight: true,
                    },
                    {
                      category: '8-Year Fuel / Energy',
                      petrol: formatETB(calculations.annualFuelCost * 8),
                      ev: formatETB(calculations.annualElectricityCost * 8),
                      highlight: true,
                    },
                    {
                      category: 'Annual Maintenance (Avg)',
                      petrol: 'ETB 25,000 - 40,000',
                      ev: 'ETB 8,000 - 15,000',
                      highlight: false,
                    },
                    {
                      category: 'Oil Changes (Annual)',
                      petrol: 'Required (4-6 times)',
                      ev: 'None required',
                      highlight: false,
                    },
                    {
                      category: 'Brake Pad Lifespan',
                      petrol: '30,000 - 50,000 km',
                      ev: '80,000 - 120,000 km',
                      highlight: false,
                    },
                    {
                      category: 'CO2 Emissions per Year',
                      petrol: `${formatNumber(calculations.annualCO2Saved)} kg`,
                      ev: '0 kg (Tailpipe)',
                      highlight: false,
                    },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-line last:border-0 ${
                        row.highlight ? 'bg-ice/60' : ''
                      }`}
                    >
                      <td className="px-6 sm:px-8 py-4 sm:py-5 text-sm sm:text-base font-semibold text-navy">
                        {row.category}
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5 text-center text-sm sm:text-base text-red-600 font-semibold">
                        {row.petrol}
                      </td>
                      <td className="px-4 sm:px-8 py-4 sm:py-5 text-center text-sm sm:text-base text-emerald-700 font-bold bg-emerald-50/60">
                        {row.ev}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
                    <td className="px-6 sm:px-8 py-5 font-bold text-base sm:text-lg">
                      Total Annual Net Savings
                    </td>
                    <td className="px-4 sm:px-8 py-5 text-center text-lg sm:text-xl font-bold opacity-70">
                      —
                    </td>
                    <td className="px-4 sm:px-8 py-5 text-center text-2xl sm:text-3xl font-extrabold">
                      {formatETB(calculations.annualSavings)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <div className="text-[13px] tracking-[0.18em] text-emerald-600 font-bold mb-4 uppercase">
              Cost Savings FAQ
            </div>
            <h2 className="disp text-3xl sm:text-4xl font-bold text-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Everything you need to know about calculating your EV savings and the true cost of ownership.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-line rounded-2xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 sm:px-8 py-5 text-left hover:bg-ice/40 transition-colors"
                >
                  <span className="font-bold text-navy text-base sm:text-lg pr-4">
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-steel flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-steel leading-relaxed text-sm sm:text-base">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 text-white py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[13px] tracking-[0.18em] text-green-100 font-bold mb-4 uppercase">
                Start Saving Today
              </div>
              <h2 className="disp text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Ready to Put These Savings in Your Pocket?
              </h2>
              <p className="text-green-50 text-lg leading-relaxed mb-8">
                Based on your driving profile, you could save <strong className="text-white">{formatETB(calculations.annualSavings)}</strong> every year
                — that's <strong className="text-white">{formatETB(calculations.eightYearSavings)}</strong> over 8 years in energy costs alone.
                Book a test drive and experience Geely EV for yourself.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/test-drive"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 font-bold text-sm px-8 py-4 rounded-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Book a Test Drive
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/models/geometry-ex5"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold text-sm px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
                >
                  Explore EV Models
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/20">
                <PiggyBank className="w-8 h-8 mb-3 text-green-200" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  {formatETB(calculations.fiveYearSavings)}
                </div>
                <div className="text-xs sm:text-sm text-green-100 font-semibold uppercase tracking-wide">
                  5-Year Savings
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/20">
                <Leaf className="w-8 h-8 mb-3 text-green-200" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  {formatNumber(calculations.annualCO2Saved)} kg
                </div>
                <div className="text-xs sm:text-sm text-green-100 font-semibold uppercase tracking-wide">
                  CO₂ Saved / Year
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/20">
                <Zap className="w-8 h-8 mb-3 text-green-200" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  {formatETB(calculations.eightYearSavings)}
                </div>
                <div className="text-xs sm:text-sm text-green-100 font-semibold uppercase tracking-wide">
                  8-Year Total Savings
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-white/20">
                <Clock className="w-8 h-8 mb-3 text-green-200" />
                <div className="text-2xl sm:text-3xl font-bold mb-1">8 Yrs</div>
                <div className="text-xs sm:text-sm text-green-100 font-semibold uppercase tracking-wide">
                  Battery Warranty
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
