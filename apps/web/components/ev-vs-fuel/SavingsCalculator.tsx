'use client';

import { useEffect, useMemo, useState } from 'react';
import { Zap, Fuel, Leaf, TrendingUp, Wallet, Wrench } from 'lucide-react';

interface SliderInput {
  default: number;
  min: number;
  max: number;
  step: number;
}

interface EvSavingsCalculatorSettings {
  enabled: boolean;
  hero: { eyebrow: string; title: string; subtitle: string };
  inputs: {
    monthlyDistanceKm: SliderInput;
    fuelPricePerLiter: SliderInput;
    electricityCostPerKwh: SliderInput;
    petrolEfficiencyKmPerL: SliderInput;
    evEfficiencyKmPerKwh: SliderInput;
  };
  assumptions: { co2KgPerLiter: number; milestoneYears: number; warrantyYears: number };
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

const DEFAULT_SETTINGS: EvSavingsCalculatorSettings = {
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
  assumptions: { co2KgPerLiter: 2.31, milestoneYears: 5, warrantyYears: 8 },
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
    comparisonDescription: 'A comprehensive look at the true cost of ownership based on your driving profile above.',
  },
};

const etb = (n: number) => `ETB ${Math.round(n).toLocaleString('en-US')}`;
const num = (n: number, decimals = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function Slider({
  label,
  icon: Icon,
  value,
  field,
  unit,
  formatValue,
  onChange,
}: {
  label: string;
  icon: typeof Zap;
  value: number;
  field: SliderInput;
  unit: string;
  formatValue: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-navy dark:text-ice">
          <Icon size={15} className="text-geely-blue dark:text-blue-bright shrink-0" />
          {label}
        </span>
        <span className="text-sm font-bold text-geely-blue dark:text-blue-bright">{formatValue(value)}</span>
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full bg-line dark:bg-midnight-line accent-geely-blue dark:accent-blue-bright cursor-pointer"
      />
      <div className="flex items-center justify-between mt-1 text-xs text-steel dark:text-steel-light">
        <span>
          {formatValue(field.min)} {unit}
        </span>
        <span>
          {formatValue(field.max)} {unit}
        </span>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sublabel,
  emphasis,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sublabel: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        emphasis
          ? 'border-geely-blue/30 dark:border-blue-bright/30 bg-geely-blue/5 dark:bg-blue-bright/10'
          : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} className={emphasis ? 'text-geely-blue dark:text-blue-bright' : 'text-steel dark:text-steel-light'} />
        <span className="text-xs font-bold uppercase tracking-wide text-steel dark:text-steel-light">{label}</span>
      </div>
      <div className={`font-display font-bold text-2xl mb-1 ${emphasis ? 'text-geely-blue dark:text-blue-bright' : 'text-navy dark:text-ice'}`}>
        {value}
      </div>
      <p className="text-xs text-steel dark:text-steel-light">{sublabel}</p>
    </div>
  );
}

export default function SavingsCalculator() {
  const [settings, setSettings] = useState<EvSavingsCalculatorSettings>(DEFAULT_SETTINGS);
  const [monthlyDistanceKm, setMonthlyDistanceKm] = useState(DEFAULT_SETTINGS.inputs.monthlyDistanceKm.default);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState(DEFAULT_SETTINGS.inputs.fuelPricePerLiter.default);
  const [electricityCostPerKwh, setElectricityCostPerKwh] = useState(DEFAULT_SETTINGS.inputs.electricityCostPerKwh.default);
  const [petrolEfficiencyKmPerL, setPetrolEfficiencyKmPerL] = useState(DEFAULT_SETTINGS.inputs.petrolEfficiencyKmPerL.default);
  const [evEfficiencyKmPerKwh, setEvEfficiencyKmPerKwh] = useState(DEFAULT_SETTINGS.inputs.evEfficiencyKmPerKwh.default);

  useEffect(() => {
    fetch('/api/public/ev-savings-calculator')
      .then(r => (r.ok ? r.json() : null))
      .then((d: EvSavingsCalculatorSettings | null) => {
        if (!d) return;
        const merged: EvSavingsCalculatorSettings = { ...DEFAULT_SETTINGS, ...d };
        setSettings(merged);
        setMonthlyDistanceKm(merged.inputs.monthlyDistanceKm.default);
        setFuelPricePerLiter(merged.inputs.fuelPricePerLiter.default);
        setElectricityCostPerKwh(merged.inputs.electricityCostPerKwh.default);
        setPetrolEfficiencyKmPerL(merged.inputs.petrolEfficiencyKmPerL.default);
        setEvEfficiencyKmPerKwh(merged.inputs.evEfficiencyKmPerKwh.default);
      })
      .catch(() => {});
  }, []);

  const results = useMemo(() => {
    const annualDistance = monthlyDistanceKm * 12;
    const litersPerYear = petrolEfficiencyKmPerL > 0 ? annualDistance / petrolEfficiencyKmPerL : 0;
    const annualFuelCost = litersPerYear * fuelPricePerLiter;
    const kwhPerYear = evEfficiencyKmPerKwh > 0 ? annualDistance / evEfficiencyKmPerKwh : 0;
    const annualElectricityCost = kwhPerYear * electricityCostPerKwh;
    const annualSavings = annualFuelCost - annualElectricityCost;
    const co2SavedPerYear = litersPerYear * settings.assumptions.co2KgPerLiter;
    const milestoneYears = settings.assumptions.milestoneYears;
    const warrantyYears = settings.assumptions.warrantyYears;
    const milestoneSavings = annualSavings * milestoneYears;
    const warrantySavings = annualSavings * warrantyYears;
    const milestonePercentOfWarranty = warrantySavings > 0 ? (milestoneSavings / warrantySavings) * 100 : 0;

    return {
      annualDistance,
      litersPerYear,
      annualFuelCost,
      kwhPerYear,
      annualElectricityCost,
      annualSavings,
      co2SavedPerYear,
      milestoneYears,
      warrantyYears,
      milestoneSavings,
      warrantySavings,
      milestonePercentOfWarranty,
      monthlyFuelBill: annualFuelCost / 12,
      costPerKmPetrol: petrolEfficiencyKmPerL > 0 ? fuelPricePerLiter / petrolEfficiencyKmPerL : 0,
      weeklyFuelSpend: annualFuelCost / 52,
      monthlyElectricityBill: annualElectricityCost / 12,
      costPerKmEV: evEfficiencyKmPerKwh > 0 ? electricityCostPerKwh / evEfficiencyKmPerKwh : 0,
      weeklyChargingCost: annualElectricityCost / 52,
    };
  }, [monthlyDistanceKm, fuelPricePerLiter, electricityCostPerKwh, petrolEfficiencyKmPerL, evEfficiencyKmPerKwh, settings.assumptions]);

  if (!settings.enabled) return null;

  const { maintenance, copy } = settings;

  const breakdownCards = [
    {
      icon: Fuel,
      title: copy.fuelBreakdownTitle,
      description: copy.fuelBreakdownDescription,
      rows: [
        { label: 'Annual fuel consumption', value: `${num(results.litersPerYear)} L` },
        { label: 'Monthly fuel bill', value: 'On request' },
        { label: 'Cost per kilometer', value: 'On request' },
        { label: 'Weekly fuel spend', value: 'On request' },
      ],
    },
    {
      icon: Zap,
      title: copy.electricityBreakdownTitle,
      description: copy.electricityBreakdownDescription,
      rows: [
        { label: 'Annual electricity consumption', value: `${num(results.kwhPerYear)} kWh` },
        { label: 'Monthly electricity bill', value: 'On request' },
        { label: 'Cost per kilometer', value: 'On request' },
        { label: 'Weekly charging cost', value: 'On request' },
      ],
    },
    {
      icon: TrendingUp,
      title: copy.projectionsTitle,
      description: copy.projectionsDescription,
      rows: [
        { label: 'Year 1 savings', value: 'On request' },
        { label: `Year ${results.milestoneYears} cumulative`, value: 'On request' },
        { label: `Year ${results.warrantyYears} cumulative`, value: 'On request' },
      ],
    },
    {
      icon: Wrench,
      title: copy.maintenanceTitle,
      description: copy.maintenanceDescription,
      rows: [
        { label: maintenance.oilChanges.label, value: 'On request' },
        { label: maintenance.brakePads.label, value: 'On request' },
        {
          label: 'Estimated total/year',
          value: 'On request',
        },
      ],
    },
  ];

  const comparisonRows: { label: string; petrol: string; electric: string }[] = [
    { label: 'Annual Fuel / Energy Cost', petrol: 'On request', electric: 'On request' },
    { label: 'Cost per Kilometer', petrol: 'On request', electric: 'On request' },
    { label: 'Monthly Running Cost (Fuel)', petrol: 'On request', electric: 'On request' },
    { label: `${results.milestoneYears}-Year Fuel / Energy`, petrol: 'On request', electric: 'On request' },
    { label: `${results.warrantyYears}-Year Fuel / Energy`, petrol: 'On request', electric: 'On request' },
    { label: 'Annual Maintenance (Avg)', petrol: 'On request', electric: 'On request' },
    { label: 'Oil Changes (Annual)', petrol: maintenance.oilChangeRequirement, electric: 'None required' },
    { label: 'Brake Pad Lifespan', petrol: maintenance.brakePadLifespanPetrol, electric: maintenance.brakePadLifespanEV },
    { label: 'CO₂ Emissions per Year', petrol: `${num(results.co2SavedPerYear)} kg`, electric: '0 kg (Tailpipe)' },
    { label: 'Total Annual Net Savings', petrol: '—', electric: 'On request' },
  ];

  return (
    <>
      {/* Calculator hero + inputs/results */}
      <section id="savings-calculator" className="bg-ice dark:bg-midnight py-12 lg:py-16 scroll-mt-20">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-geely-blue dark:text-blue-bright mb-3">
              {settings.hero.eyebrow}
            </p>
            <h2 className="font-display font-bold text-2xl lg:text-4xl text-navy dark:text-ice mb-3">
              {settings.hero.title}
            </h2>
            <p className="text-steel dark:text-steel-light max-w-2xl mx-auto">{settings.hero.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Inputs */}
            <div className="lg:col-span-2 rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-6 lg:p-8 shadow-sm">
              <h3 className="font-display font-bold text-lg text-navy dark:text-ice mb-1">Your Driving Profile</h3>
              <p className="text-xs text-steel dark:text-steel-light mb-6">Customize the values below</p>

              <div className="space-y-6">
                <Slider
                  label="Monthly Distance"
                  icon={Wallet}
                  value={monthlyDistanceKm}
                  field={settings.inputs.monthlyDistanceKm}
                  unit="km"
                  formatValue={v => `${num(v)} km`}
                  onChange={setMonthlyDistanceKm}
                />
                <p className="text-xs text-steel dark:text-steel-light -mt-4">{num(monthlyDistanceKm * 12)} km/year</p>

                <Slider
                  label="Fuel Price per Liter"
                  icon={Fuel}
                  value={fuelPricePerLiter}
                  field={settings.inputs.fuelPricePerLiter}
                  unit="ETB"
                  formatValue={v => `ETB ${num(v)}`}
                  onChange={setFuelPricePerLiter}
                />

                <Slider
                  label="Electricity Cost per kWh"
                  icon={Zap}
                  value={electricityCostPerKwh}
                  field={settings.inputs.electricityCostPerKwh}
                  unit="ETB"
                  formatValue={v => `ETB ${num(v)}`}
                  onChange={setElectricityCostPerKwh}
                />

                <Slider
                  label="Petrol Vehicle Efficiency"
                  icon={Fuel}
                  value={petrolEfficiencyKmPerL}
                  field={settings.inputs.petrolEfficiencyKmPerL}
                  unit="km/l"
                  formatValue={v => `${num(v)} km/l`}
                  onChange={setPetrolEfficiencyKmPerL}
                />

                <Slider
                  label="EV Efficiency"
                  icon={Zap}
                  value={evEfficiencyKmPerKwh}
                  field={settings.inputs.evEfficiencyKmPerKwh}
                  unit="km/kWh"
                  formatValue={v => `${num(v, v % 1 === 0 ? 0 : 1)} km/kWh`}
                  onChange={setEvEfficiencyKmPerKwh}
                />
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4 content-start">
              <StatTile
                icon={Fuel}
                label="Annual Fuel Cost (Petrol)"
                value="On request"
                sublabel={`${num(results.litersPerYear)} liters consumed per year`}
              />
              <StatTile
                icon={Zap}
                label="Annual Electricity Cost (EV)"
                value="On request"
                sublabel={`${num(results.kwhPerYear)} kWh consumed per year`}
              />
              <StatTile
                icon={Wallet}
                label="Annual Savings"
                value="On request"
                sublabel="That's how much less you'll spend on energy alone each year with a Geely EV."
                emphasis
              />
              <StatTile
                icon={Leaf}
                label="CO₂ Saved / Year"
                value={`${num(results.co2SavedPerYear)} kg`}
                sublabel="Zero tailpipe emissions, city or highway."
              />
              <StatTile
                icon={TrendingUp}
                label={`${results.milestoneYears}-Year Total Savings`}
                value="On request"
                sublabel={`${num(results.milestonePercentOfWarranty, 1)}% of ${results.warrantyYears}-year horizon`}
              />
              <StatTile
                icon={TrendingUp}
                label={`${results.warrantyYears}-Year Total Savings`}
                value="On request"
                sublabel="Full EV warranty period coverage"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Understanding your savings */}
      <section className="max-w-[1280px] mx-auto px-4 py-12 lg:py-16">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-geely-blue dark:text-blue-bright mb-3">
            {copy.savingsSectionEyebrow}
          </p>
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-navy dark:text-ice mb-3">
            {copy.savingsSectionTitle}
          </h2>
          <p className="text-steel dark:text-steel-light max-w-2xl mx-auto">{copy.savingsSectionDescription}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {breakdownCards.map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-6 lg:p-8 shadow-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-geely-blue/10 dark:bg-blue-bright/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-geely-blue dark:text-blue-bright" />
                </div>
                <h3 className="font-display font-bold text-lg text-navy dark:text-ice mb-2">{card.title}</h3>
                <p className="text-sm text-steel dark:text-steel-light mb-5">{card.description}</p>
                <div className="space-y-2.5">
                  {card.rows.map(row => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between text-sm border-t border-line dark:border-midnight-line pt-2.5"
                    >
                      <span className="text-steel dark:text-steel-light">{row.label}</span>
                      <span className="font-bold text-navy dark:text-ice">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-ice dark:bg-midnight py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-geely-blue dark:text-blue-bright mb-3">
              {copy.comparisonEyebrow}
            </p>
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-navy dark:text-ice mb-3">
              {copy.comparisonTitle}
            </h2>
            <p className="text-steel dark:text-steel-light max-w-2xl mx-auto">{copy.comparisonDescription}</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface shadow-sm">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-line dark:border-midnight-line">
                  <th className="text-left px-6 py-4 font-display font-bold text-navy dark:text-ice">Cost Category</th>
                  <th className="text-left px-6 py-4 font-display font-bold text-[#8a6500]">
                    <span className="inline-flex items-center gap-2">
                      <Fuel size={16} /> Petrol Vehicle
                    </span>
                  </th>
                  <th className="text-left px-6 py-4 font-display font-bold text-geely-blue dark:text-blue-bright">
                    <span className="inline-flex items-center gap-2">
                      <Zap size={16} /> Geely Electric
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={row.label} className={i % 2 === 1 ? 'bg-cloud/40 dark:bg-midnight/40' : undefined}>
                    <td className="px-6 py-4 align-top font-semibold text-navy dark:text-ice">{row.label}</td>
                    <td className="px-6 py-4 align-top text-steel dark:text-steel-light">{row.petrol}</td>
                    <td className="px-6 py-4 align-top text-steel dark:text-steel-light">{row.electric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
