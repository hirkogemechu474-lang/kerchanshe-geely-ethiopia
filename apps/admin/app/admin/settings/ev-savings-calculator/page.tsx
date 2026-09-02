'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Zap,
  Fuel,
  Gauge,
  Leaf,
  Wrench,
  TrendingUp,
  Table2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SliderInput {
  default: number;
  min: number;
  max: number;
  step: number;
}

interface EvSavingsCalculatorSettings {
  enabled: boolean;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  inputs: {
    monthlyDistanceKm: SliderInput;
    fuelPricePerLiter: SliderInput;
    electricityCostPerKwh: SliderInput;
    petrolEfficiencyKmPerL: SliderInput;
    evEfficiencyKmPerKwh: SliderInput;
  };
  assumptions: {
    co2KgPerLiter: number;
    milestoneYears: number;
    warrantyYears: number;
  };
  maintenance: {
    oilChanges: { label: string; min: number; max: number };
    brakePads: { label: string; min: number; max: number };
    petrolAnnualMin: number;
    petrolAnnualMax: number;
    evAnnualMin: number;
    evAnnualMax: number;
    oilChangeRequirement: string;
    brakePadLifespanPetrol: string;
    brakePadLifespanEV: string;
  };
  copy: {
    savingsSectionEyebrow: string;
    savingsSectionTitle: string;
    savingsSectionDescription: string;
    fuelBreakdownTitle: string;
    fuelBreakdownDescription: string;
    electricityBreakdownTitle: string;
    electricityBreakdownDescription: string;
    projectionsTitle: string;
    projectionsDescription: string;
    maintenanceTitle: string;
    maintenanceDescription: string;
    comparisonEyebrow: string;
    comparisonTitle: string;
    comparisonDescription: string;
  };
}

const DEFAULT_DATA: EvSavingsCalculatorSettings = {
  enabled: true,
  hero: {
    eyebrow: "Discover How Much You'll Save",
    title: 'Calculate Your Savings',
    subtitle: 'See how much you can save by switching to an electric vehicle',
  },
  inputs: {
    monthlyDistanceKm: { default: 4750, min: 100, max: 5000, step: 50 },
    fuelPricePerLiter: { default: 280, min: 50, max: 400, step: 5 },
    electricityCostPerKwh: { default: 40, min: 5, max: 60, step: 1 },
    petrolEfficiencyKmPerL: { default: 12, min: 5, max: 25, step: 1 },
    evEfficiencyKmPerKwh: { default: 6, min: 3, max: 12, step: 0.5 },
  },
  assumptions: {
    co2KgPerLiter: 2.31,
    milestoneYears: 5,
    warrantyYears: 8,
  },
  maintenance: {
    oilChanges: { label: 'Oil changes (4x/yr)', min: 8000, max: 12000 },
    brakePads: { label: 'Brake pads & parts', min: 5000, max: 10000 },
    petrolAnnualMin: 25000,
    petrolAnnualMax: 40000,
    evAnnualMin: 8000,
    evAnnualMax: 15000,
    oilChangeRequirement: 'Required (4-6 times)',
    brakePadLifespanPetrol: '30,000 - 50,000 km',
    brakePadLifespanEV: '80,000 - 120,000 km',
  },
  copy: {
    savingsSectionEyebrow: 'Understanding Your Savings',
    savingsSectionTitle: 'The Economics of Electric Driving',
    savingsSectionDescription:
      'Break down exactly where your savings come from and why switching to electric makes long-term financial sense for Ethiopian drivers.',
    fuelBreakdownTitle: 'Fuel Cost Breakdown',
    fuelBreakdownDescription:
      'At your current driving pace, a petrol vehicle consumes a significant amount of fuel annually. At current pump prices, this adds up to a significant annual expense that only increases as fuel prices rise.',
    electricityBreakdownTitle: 'Electricity Cost Analysis',
    electricityBreakdownDescription:
      'Electric vehicles convert energy far more efficiently. The same annual distance requires dramatically cheaper electricity per kilometer than petrol.',
    projectionsTitle: 'Long-Term Savings Projections',
    projectionsDescription:
      'Your savings compound year after year. Within the EV battery warranty period, you could save enough to cover a significant portion of the vehicle cost or fund other major life expenses.',
    maintenanceTitle: 'Maintenance Savings',
    maintenanceDescription:
      'Beyond fuel savings, EVs dramatically reduce maintenance costs. No oil changes, no spark plugs, no timing belts, and regenerative braking extends brake pad life by 2-3 times.',
    comparisonEyebrow: 'Side-by-Side Comparison',
    comparisonTitle: 'Petrol Vehicle vs Electric Vehicle',
    comparisonDescription:
      'A comprehensive look at the true cost of ownership based on your driving profile above.',
  },
};

function deepMerge<T>(base: T, override: any): T {
  if (typeof override !== 'object' || override === null || Array.isArray(override)) {
    return (override ?? base) as T;
  }
  const result: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const key of Object.keys(base as any)) {
    result[key] = deepMerge((base as any)[key], override?.[key]);
  }
  return result;
}

const etb = (n: number) =>
  `ETB ${Math.round(n).toLocaleString('en-US')}`;

export default function EvSavingsCalculatorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<EvSavingsCalculatorSettings>(DEFAULT_DATA);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/ev-savings-calculator');
        if (res.ok) {
          const json = await res.json();
          setData(deepMerge(DEFAULT_DATA, json));
        }
      } catch {
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/ev-savings-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save EV savings calculator settings');
      }
    } catch {
      alert('Failed to save EV savings calculator settings');
    } finally {
      setSaving(false);
    }
  };

  const updateHero = (changes: Partial<EvSavingsCalculatorSettings['hero']>) =>
    setData(d => ({ ...d, hero: { ...d.hero, ...changes } }));

  const updateInput = (key: keyof EvSavingsCalculatorSettings['inputs'], changes: Partial<SliderInput>) =>
    setData(d => ({ ...d, inputs: { ...d.inputs, [key]: { ...d.inputs[key], ...changes } } }));

  const updateAssumptions = (changes: Partial<EvSavingsCalculatorSettings['assumptions']>) =>
    setData(d => ({ ...d, assumptions: { ...d.assumptions, ...changes } }));

  const updateMaintenance = (changes: Partial<EvSavingsCalculatorSettings['maintenance']>) =>
    setData(d => ({ ...d, maintenance: { ...d.maintenance, ...changes } }));

  const updateCopy = (changes: Partial<EvSavingsCalculatorSettings['copy']>) =>
    setData(d => ({ ...d, copy: { ...d.copy, ...changes } }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Sparkles className="animate-spin w-5 h-5" /> Loading EV savings calculator settings...
        </div>
      </div>
    );
  }

  // Live preview numbers, computed from the current default slider values.
  const annualDistance = data.inputs.monthlyDistanceKm.default * 12;
  const litersPerYear = annualDistance / data.inputs.petrolEfficiencyKmPerL.default;
  const annualFuelCost = litersPerYear * data.inputs.fuelPricePerLiter.default;
  const kwhPerYear = annualDistance / data.inputs.evEfficiencyKmPerKwh.default;
  const annualElectricityCost = kwhPerYear * data.inputs.electricityCostPerKwh.default;
  const annualSavings = annualFuelCost - annualElectricityCost;
  const co2SavedPerYear = litersPerYear * data.assumptions.co2KgPerLiter;

  const sliderFields: {
    key: keyof EvSavingsCalculatorSettings['inputs'];
    label: string;
    unit: string;
    icon: typeof Gauge;
  }[] = [
    { key: 'monthlyDistanceKm', label: 'Monthly Distance', unit: 'km', icon: Gauge },
    { key: 'fuelPricePerLiter', label: 'Fuel Price per Liter', unit: 'ETB', icon: Fuel },
    { key: 'electricityCostPerKwh', label: 'Electricity Cost per kWh', unit: 'ETB', icon: Zap },
    { key: 'petrolEfficiencyKmPerL', label: 'Petrol Vehicle Efficiency', unit: 'km/l', icon: Fuel },
    { key: 'evEfficiencyKmPerKwh', label: 'EV Efficiency', unit: 'km/kWh', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-bold">EV vs Fuel Savings Calculator</h1>
          <p className="text-gray-600">Slider defaults, ranges, assumptions, and copy for the /ev-vs-fuel savings calculator</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <input
              type="checkbox"
              checked={data.enabled}
              onChange={e => setData(d => ({ ...d, enabled: e.target.checked }))}
              className="rounded text-geely-blue focus:ring-geely-blue"
            />
            Show on website
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
            {savedAt && (
              <span className="ml-1 text-xs text-blue-100 opacity-90 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedAt}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card: Hero copy */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-geely-blue via-indigo-500 to-navy p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">Hero Copy</h2>
                <p className="text-blue-100 text-sm">Eyebrow, headline, and subtitle above the calculator</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Eyebrow</label>
              <input
                value={data.hero.eyebrow}
                onChange={e => updateHero({ eyebrow: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Title</label>
                <input
                  value={data.hero.title}
                  onChange={e => updateHero({ title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Subtitle</label>
                <input
                  value={data.hero.subtitle}
                  onChange={e => updateHero({ subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Slider inputs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Gauge className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">Driving Profile Sliders</h2>
                <p className="text-orange-100 text-sm">Default value and min/max/step range for each slider</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {sliderFields.map(({ key, label, unit, icon: Icon }) => {
              const field = data.inputs[key];
              return (
                <div key={key} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-400">({unit})</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Default</label>
                      <input
                        type="number"
                        value={field.default}
                        onChange={e => updateInput(key, { default: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Min</label>
                      <input
                        type="number"
                        value={field.min}
                        onChange={e => updateInput(key, { min: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Max</label>
                      <input
                        type="number"
                        value={field.max}
                        onChange={e => updateInput(key, { max: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Step</label>
                      <input
                        type="number"
                        value={field.step}
                        onChange={e => updateInput(key, { step: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-4 h-4 text-geely-blue" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-blue-900">Live preview at default values</div>
                <div className="text-blue-800 mt-1 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                  <span>Annual Fuel Cost: <strong>{etb(annualFuelCost)}</strong></span>
                  <span>Annual Electricity Cost: <strong>{etb(annualElectricityCost)}</strong></span>
                  <span>Annual Savings: <strong>{etb(annualSavings)}</strong></span>
                  <span>CO₂ Saved / Year: <strong>{Math.round(co2SavedPerYear).toLocaleString()} kg</strong></span>
                  <span>{data.assumptions.milestoneYears}-Year Savings: <strong>{etb(annualSavings * data.assumptions.milestoneYears)}</strong></span>
                  <span>{data.assumptions.warrantyYears}-Year Savings: <strong>{etb(annualSavings * data.assumptions.warrantyYears)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Assumptions */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">Assumptions</h2>
                <p className="text-emerald-100 text-sm">CO₂ emission factor and savings-projection horizons</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">CO₂ per Liter (kg)</label>
              <input
                type="number"
                step="0.01"
                value={data.assumptions.co2KgPerLiter}
                onChange={e => updateAssumptions({ co2KgPerLiter: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-400 mt-1">Used for annual CO₂ saved (liters × factor)</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Milestone Years</label>
              <input
                type="number"
                value={data.assumptions.milestoneYears}
                onChange={e => updateAssumptions({ milestoneYears: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-400 mt-1">e.g. 5-year cumulative savings milestone</div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Warranty Years</label>
              <input
                type="number"
                value={data.assumptions.warrantyYears}
                onChange={e => updateAssumptions({ warrantyYears: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <div className="text-xs text-gray-400 mt-1">e.g. 8-year EV battery warranty horizon</div>
            </div>
          </div>
        </div>

        {/* Card: Maintenance savings */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">Maintenance Savings</h2>
                <p className="text-purple-100 text-sm">Static ranges shown in the maintenance and comparison sections</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">Oil Changes — Label</label>
                <input
                  value={data.maintenance.oilChanges.label}
                  onChange={e => updateMaintenance({ oilChanges: { ...data.maintenance.oilChanges, label: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Saved Min (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.oilChanges.min}
                      onChange={e => updateMaintenance({ oilChanges: { ...data.maintenance.oilChanges, min: parseFloat(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Saved Max (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.oilChanges.max}
                      onChange={e => updateMaintenance({ oilChanges: { ...data.maintenance.oilChanges, max: parseFloat(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-xs font-medium text-gray-500 mb-1">Brake Pads — Label</label>
                <input
                  value={data.maintenance.brakePads.label}
                  onChange={e => updateMaintenance({ brakePads: { ...data.maintenance.brakePads, label: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Saved Min (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.brakePads.min}
                      onChange={e => updateMaintenance({ brakePads: { ...data.maintenance.brakePads, min: parseFloat(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Saved Max (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.brakePads.max}
                      onChange={e => updateMaintenance({ brakePads: { ...data.maintenance.brakePads, max: parseFloat(e.target.value) || 0 } })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-800 mb-3">Annual Maintenance (Avg) — Petrol</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Min (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.petrolAnnualMin}
                      onChange={e => updateMaintenance({ petrolAnnualMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Max (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.petrolAnnualMax}
                      onChange={e => updateMaintenance({ petrolAnnualMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Brake Pad Lifespan (text)</label>
                  <input
                    value={data.maintenance.brakePadLifespanPetrol}
                    onChange={e => updateMaintenance({ brakePadLifespanPetrol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-sm font-semibold text-gray-800 mb-3">Annual Maintenance (Avg) — Electric</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Min (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.evAnnualMin}
                      onChange={e => updateMaintenance({ evAnnualMin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Max (ETB)</label>
                    <input
                      type="number"
                      value={data.maintenance.evAnnualMax}
                      onChange={e => updateMaintenance({ evAnnualMax: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Brake Pad Lifespan (text)</label>
                  <input
                    value={data.maintenance.brakePadLifespanEV}
                    onChange={e => updateMaintenance({ brakePadLifespanEV: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Petrol Oil Change Requirement (text)</label>
              <input
                value={data.maintenance.oilChangeRequirement}
                onChange={e => updateMaintenance({ oilChangeRequirement: e.target.value })}
                className="w-full md:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Card: Section copy */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-navy p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <Table2 className="w-7 h-7 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-xl font-bold">Section Copy</h2>
                <p className="text-slate-200 text-sm">Headlines and descriptions for each breakdown card and the comparison table</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Savings Section Eyebrow</label>
                <input
                  value={data.copy.savingsSectionEyebrow}
                  onChange={e => updateCopy({ savingsSectionEyebrow: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Savings Section Title</label>
                <input
                  value={data.copy.savingsSectionTitle}
                  onChange={e => updateCopy({ savingsSectionTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Savings Section Description</label>
              <textarea
                value={data.copy.savingsSectionDescription}
                onChange={e => updateCopy({ savingsSectionDescription: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            {([
              ['fuelBreakdownTitle', 'fuelBreakdownDescription', 'Fuel Cost Breakdown'],
              ['electricityBreakdownTitle', 'electricityBreakdownDescription', 'Electricity Cost Analysis'],
              ['projectionsTitle', 'projectionsDescription', 'Long-Term Savings Projections'],
              ['maintenanceTitle', 'maintenanceDescription', 'Maintenance Savings'],
            ] as const).map(([titleKey, descKey, label]) => (
              <div key={titleKey} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                    <input
                      value={data.copy[titleKey]}
                      onChange={e => updateCopy({ [titleKey]: e.target.value } as Partial<EvSavingsCalculatorSettings['copy']>)}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <textarea
                      value={data.copy[descKey]}
                      onChange={e => updateCopy({ [descKey]: e.target.value } as Partial<EvSavingsCalculatorSettings['copy']>)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Comparison Table</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Eyebrow</label>
                  <input
                    value={data.copy.comparisonEyebrow}
                    onChange={e => updateCopy({ comparisonEyebrow: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    value={data.copy.comparisonTitle}
                    onChange={e => updateCopy({ comparisonTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={data.copy.comparisonDescription}
                  onChange={e => updateCopy({ comparisonDescription: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 z-10">
        <div className="bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-lg p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Changes appear on /ev-vs-fuel immediately after saving
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-geely-blue to-indigo-600 text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 font-medium"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save All Changes'}
            {savedAt && (
              <span className="ml-1 text-xs text-blue-100 opacity-90 flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedAt}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
