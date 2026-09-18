"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, ShieldCheck, ArrowRight } from "lucide-react";
import { calculateLoan } from "@/lib/financeCalculator";

export interface CalcVehicle {
  id: string;
  name: string;
  finalPrice?: number | null;
  basePrice?: number | null;
  hidePrice?: boolean;
}

export interface CalcProgram {
  id: string;
  name: string;
  interestRate: string | number;
  downPaymentPercent: string | number;
  minDownPaymentPercent: string | number;
  maxDownPaymentPercent: string | number;
  tenureMonths: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  processingFeePercent: string | number;
  insurancePercent: string | number;
  vehicleId: string | null;
  appliesToAllVehicles: boolean;
  badgeText: string | null;
  highlightBadge: boolean;
  finePrint: string | null;
  eligibilityNote: string | null;
  bank: { id: string; name: string; logoUrl?: string | null };
}

function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(
    Math.max(0, Math.round(amount))
  );
}

function num(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

export function FinanceCalculator({
  vehicles,
  programs,
  initialVehicleId,
}: {
  vehicles: CalcVehicle[];
  programs: CalcProgram[];
  initialVehicleId?: string;
}) {
  // hidePrice hides price on browsing/marketing pages so customers go
  // through a formal quote first — the Finance Calculator is one of the
  // deliberate exceptions (same as the Configurator, see the comment in
  // apps/web/app/models/[id]/page.tsx), since its entire purpose is
  // computing a payment from the price. Only actually-missing price data
  // excludes a vehicle here.
  const priceableVehicles = useMemo(() => vehicles.filter((v) => v.finalPrice || v.basePrice), [vehicles]);

  const [vehicleId, setVehicleId] = useState<string>(
    initialVehicleId && priceableVehicles.some((v) => v.id === initialVehicleId)
      ? initialVehicleId
      : priceableVehicles[0]?.id ?? ""
  );

  const vehicle = priceableVehicles.find((v) => v.id === vehicleId) ?? priceableVehicles[0];
  const vehiclePrice = vehicle ? Number(vehicle.finalPrice || vehicle.basePrice || 0) : 0;

  const matchingPrograms = useMemo(
    () => programs.filter((p) => p.appliesToAllVehicles || p.vehicleId === vehicleId),
    [programs, vehicleId]
  );

  const [programId, setProgramId] = useState<string>(matchingPrograms[0]?.id ?? "");
  const program = matchingPrograms.find((p) => p.id === programId) ?? matchingPrograms[0];

  const [downPaymentPercent, setDownPaymentPercent] = useState(0);
  const [tenureMonths, setTenureMonths] = useState(0);

  // Re-baseline the sliders to the newly-selected program's defaults —
  // separate effect from vehicle selection so switching vehicles (which
  // changes the matching-program list) and switching programs (which
  // changes the rate/range) don't fight over the same state update.
  useEffect(() => {
    if (!matchingPrograms.some((p) => p.id === programId)) {
      setProgramId(matchingPrograms[0]?.id ?? "");
    }
  }, [matchingPrograms, programId]);

  useEffect(() => {
    if (!program) return;
    setDownPaymentPercent(num(program.downPaymentPercent));
    setTenureMonths(program.tenureMonths);
  }, [program?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!vehicle || !program) {
    return (
      <div className="rounded-2xl border border-dashed border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-10 text-center text-steel dark:text-steel-light">
        {vehicles.length === 0
          ? "Vehicle pricing isn't available right now — contact us for a personalized quote."
          : "No active financing programs match this vehicle yet — contact us for current offers."}
      </div>
    );
  }

  const minDp = num(program.minDownPaymentPercent);
  const maxDp = num(program.maxDownPaymentPercent);
  const minTenure = program.minTenureMonths;
  const maxTenure = program.maxTenureMonths;

  const result = calculateLoan({
    vehiclePrice,
    downPaymentPercent,
    annualInterestRatePercent: num(program.interestRate),
    tenureMonths,
  });

  const processingFee = Math.round((vehiclePrice * num(program.processingFeePercent)) / 100);
  const annualInsurance = Math.round((vehiclePrice * num(program.insurancePercent)) / 100);

  return (
    <div className="rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5">
        {/* ── Inputs ──────────────────────────────────────────────── */}
        <div className="lg:col-span-3 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2 text-geely-blue">
            <Calculator className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Estimate your repayment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-steel dark:text-steel-light mb-1.5">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-lg border border-line dark:border-midnight-line bg-white dark:bg-midnight px-3 py-2.5 text-sm text-navy dark:text-ice"
              >
                {priceableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-steel dark:text-steel-light mb-1.5">Financing partner</label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                className="w-full rounded-lg border border-line dark:border-midnight-line bg-white dark:bg-midnight px-3 py-2.5 text-sm text-navy dark:text-ice"
              >
                {matchingPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.bank.name} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-xs font-semibold text-steel dark:text-steel-light">Down payment</label>
              <span className="text-sm font-bold text-navy dark:text-ice tabular-nums">
                {downPaymentPercent.toFixed(0)}% &middot; {formatETB(result.downPaymentAmount)}
              </span>
            </div>
            <input
              type="range"
              min={minDp}
              max={maxDp}
              step={1}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-geely-blue"
            />
            <div className="flex justify-between text-[11px] text-steel dark:text-steel-light mt-1">
              <span>{minDp}%</span>
              <span>{maxDp}%</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-xs font-semibold text-steel dark:text-steel-light">Loan term</label>
              <span className="text-sm font-bold text-navy dark:text-ice tabular-nums">{tenureMonths} months</span>
            </div>
            <input
              type="range"
              min={minTenure}
              max={maxTenure}
              step={1}
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full accent-geely-blue"
            />
            <div className="flex justify-between text-[11px] text-steel dark:text-steel-light mt-1">
              <span>{minTenure} mo</span>
              <span>{maxTenure} mo</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
            <div>
              <div className="text-steel dark:text-steel-light">Vehicle price</div>
              <div className="font-semibold text-navy dark:text-ice tabular-nums">{formatETB(vehiclePrice)}</div>
            </div>
            <div>
              <div className="text-steel dark:text-steel-light">Interest rate (p.a.)</div>
              <div className="font-semibold text-navy dark:text-ice tabular-nums">{num(program.interestRate).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-steel dark:text-steel-light">Est. processing fee</div>
              <div className="font-semibold text-navy dark:text-ice tabular-nums">{formatETB(processingFee)}</div>
            </div>
            <div>
              <div className="text-steel dark:text-steel-light">Est. annual insurance</div>
              <div className="font-semibold text-navy dark:text-ice tabular-nums">{formatETB(annualInsurance)}</div>
            </div>
          </div>
        </div>

        {/* ── Result ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-navy text-white p-6 md:p-8 flex flex-col justify-between">
          <div>
            {program.badgeText && (
              <span className="inline-flex items-center gap-1.5 bg-gold/20 text-gold text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                {program.badgeText}
              </span>
            )}
            <div className="text-[13px] text-[#b9cbe4] mb-1">Estimated monthly payment</div>
            <div className="text-4xl font-bold tabular-nums mb-4">{formatETB(result.monthlyPayment)}</div>

            <dl className="space-y-2 text-sm border-t border-white/10 pt-4">
              <div className="flex justify-between">
                <dt className="text-[#b9cbe4]">Loan amount</dt>
                <dd className="font-semibold tabular-nums">{formatETB(result.principal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#b9cbe4]">Total interest</dt>
                <dd className="font-semibold tabular-nums">{formatETB(result.totalInterest)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#b9cbe4]">Total repayable</dt>
                <dd className="font-semibold tabular-nums">{formatETB(result.totalRepayable)}</dd>
              </div>
            </dl>

            {program.eligibilityNote && (
              <p className="flex items-start gap-2 text-xs text-[#b9cbe4] mt-5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                {program.eligibilityNote}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-2.5">
            {/* /financing/apply requires an already-approved, signed
                Quotation (see its "Request a Quote First" gate) — a
                calculator estimate isn't one, so this starts the real
                funnel (get a formal quote) rather than dead-ending there. */}
            <Link
              href={`/quote?model=${vehicle.id}`}
              className="flex items-center justify-center gap-2 bg-gold text-[#2c2308] font-bold px-6 py-3.5 rounded-xl hover:bg-opacity-90 transition-all"
            >
              Get a Quote for This Estimate <ArrowRight size={18} />
            </Link>
            <Link
              href={`/financing/apply-loan?vehicle=${vehicle.id}&program=${program.id}`}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/15 transition-all text-sm"
            >
              Or Apply for Financing Directly
            </Link>
            {program.finePrint && <p className="text-[11px] text-[#8fa5c4] mt-3 leading-relaxed">{program.finePrint}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
