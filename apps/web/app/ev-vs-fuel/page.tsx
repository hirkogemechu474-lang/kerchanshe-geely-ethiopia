import { Metadata } from "next";
import Link from "next/link";
import { MainLayout } from "@/components/MainLayout";
import SavingsCalculator from "@/components/ev-vs-fuel/SavingsCalculator";
import {
  Zap,
  Fuel,
  Wallet,
  Wrench,
  Leaf,
  Gauge,
  MapPin,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Electric vs. Fuel | Which Geely Is Right for You?",
  description:
    "Compare Geely's electric and fuel-powered vehicles side by side — running costs, charging vs. refueling, maintenance, range, and environmental impact — to find the right fit for how you drive.",
  keywords:
    "Geely electric vs fuel, EV comparison Ethiopia, Geely EV, Geely petrol, electric car running cost, fuel car maintenance",
  openGraph: {
    title: "Electric vs. Fuel | Which Geely Is Right for You?",
    description:
      "A side-by-side look at Geely's electric and fuel-powered lineups — costs, charging, maintenance, range, and environmental impact.",
  },
};

interface ComparisonRow {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  electric: string;
  fuel: string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Running Cost",
    icon: Wallet,
    electric: "Lower cost per km — electricity is cheaper than petrol/diesel per kilometer driven.",
    fuel: "Higher cost per km, tracking fuel prices directly.",
  },
  {
    label: "Refueling / Charging",
    icon: Clock,
    electric: "Charge overnight at home or at a public charging station — no fuel-station stops for daily driving.",
    fuel: "A few minutes at any fuel station, with a dense refueling network already in place.",
  },
  {
    label: "Maintenance",
    icon: Wrench,
    electric: "Fewer moving parts (no engine oil, exhaust, or transmission service) — lower long-term maintenance.",
    fuel: "Standard service intervals — oil changes, filters, and exhaust system upkeep.",
  },
  {
    label: "Range & Trip Planning",
    icon: MapPin,
    electric: "Best suited to daily commuting and city driving; longer trips need charging-stop planning.",
    fuel: "Refuel almost anywhere in minutes — best for long-distance and rural driving today.",
  },
  {
    label: "Performance",
    icon: Gauge,
    electric: "Instant torque from a standstill, quiet cabin, smooth acceleration.",
    fuel: "Familiar driving feel, proven power delivery across a wide range of conditions.",
  },
  {
    label: "Environmental Impact",
    icon: Leaf,
    electric: "Zero tailpipe emissions — cleaner running, especially in city traffic.",
    fuel: "Tailpipe emissions apply; modern engines are more efficient than older generations.",
  },
];

export default function EvVsFuelPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy to-geely-blue dark:from-midnight dark:to-navy text-white">
        <div className="max-w-[1280px] mx-auto px-4 py-16 lg:py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-3">
            Choosing Your Geely
          </p>
          <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
            Electric vs. Fuel
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base lg:text-lg">
            Every Geely — electric or fuel-powered — is built on the same commitment to safety,
            technology, and quality. Here&apos;s how the two power a different kind of drive.
          </p>
        </div>
      </section>

      {/* Quick summary cards */}
      <section className="max-w-[1280px] mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-geely-blue/10 dark:bg-blue-bright/10 flex items-center justify-center mb-4">
              <Zap size={24} className="text-geely-blue dark:text-blue-bright" />
            </div>
            <h2 className="font-display font-bold text-xl text-navy dark:text-ice mb-2">Electric</h2>
            <p className="text-sm text-steel dark:text-steel-light mb-4">
              Best if you mostly drive in the city, can charge at home or work, and want the
              lowest running cost and a quieter ride.
            </p>
            <Link
              href="/models?category=electric"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-geely-blue dark:text-blue-bright hover:underline"
            >
              Explore Electric Models <ArrowRight size={16} />
            </Link>
          </div>

          <div className="rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
              <Fuel size={24} className="text-[#8a6500]" />
            </div>
            <h2 className="font-display font-bold text-xl text-navy dark:text-ice mb-2">Fuel</h2>
            <p className="text-sm text-steel dark:text-steel-light mb-4">
              Best if you regularly drive long distances, don&apos;t have reliable charging access
              yet, or want the flexibility of refueling anywhere in minutes.
            </p>
            <Link
              href="/models"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-geely-blue dark:text-blue-bright hover:underline"
            >
              Explore Fuel Models <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Savings calculator */}
      <SavingsCalculator />

      {/* Comparison table */}
      <section className="bg-ice dark:bg-midnight py-12 lg:py-16">
        <div className="max-w-[1280px] mx-auto px-4">
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-navy dark:text-ice text-center mb-10">
            Side by Side
          </h2>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line dark:border-midnight-line">
                  <th className="text-left px-6 py-4 font-display font-bold text-navy dark:text-ice w-1/4">
                    &nbsp;
                  </th>
                  <th className="text-left px-6 py-4 font-display font-bold text-geely-blue dark:text-blue-bright">
                    <span className="inline-flex items-center gap-2">
                      <Zap size={16} /> Electric
                    </span>
                  </th>
                  <th className="text-left px-6 py-4 font-display font-bold text-[#8a6500]">
                    <span className="inline-flex items-center gap-2">
                      <Fuel size={16} /> Fuel
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => {
                  const Icon = row.icon;
                  return (
                    <tr
                      key={row.label}
                      className={i % 2 === 1 ? "bg-cloud/40 dark:bg-midnight/40" : undefined}
                    >
                      <td className="px-6 py-5 align-top">
                        <span className="inline-flex items-center gap-2 font-semibold text-navy dark:text-ice">
                          <Icon size={16} className="text-steel dark:text-steel-light shrink-0" />
                          {row.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top text-steel dark:text-steel-light">{row.electric}</td>
                      <td className="px-6 py-5 align-top text-steel dark:text-steel-light">{row.fuel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {COMPARISON_ROWS.map((row) => {
              const Icon = row.icon;
              return (
                <div
                  key={row.label}
                  className="rounded-xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-5 shadow-sm"
                >
                  <span className="inline-flex items-center gap-2 font-display font-bold text-navy dark:text-ice mb-3">
                    <Icon size={16} className="text-steel dark:text-steel-light" />
                    {row.label}
                  </span>
                  <div className="space-y-3">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-geely-blue dark:text-blue-bright mb-1">
                        <Zap size={13} /> Electric
                      </span>
                      <p className="text-sm text-steel dark:text-steel-light">{row.electric}</p>
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#8a6500] mb-1">
                        <Fuel size={13} /> Fuel
                      </span>
                      <p className="text-sm text-steel dark:text-steel-light">{row.fuel}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Not sure? */}
      <section className="max-w-[1280px] mx-auto px-4 py-12 lg:py-16">
        <div className="rounded-2xl bg-navy dark:bg-midnight-surface text-white p-8 lg:p-12 text-center">
          <h2 className="font-display font-bold text-2xl lg:text-3xl mb-3">Still not sure which is right for you?</h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Talk to a sales consultant, or take either type for a test drive — the best way to
            feel the difference is behind the wheel.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/test-drive"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-geely-blue dark:bg-blue-bright text-white dark:text-midnight font-display font-bold px-6 py-3 rounded hover:bg-opacity-90 transition-all"
            >
              Book a Test Drive <ArrowRight size={16} />
            </Link>
            <Link
              href="/quote"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/30 text-white font-display font-bold px-6 py-3 rounded hover:bg-white/10 transition-all"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
