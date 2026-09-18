"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, LoaderCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { calculateLoan } from "@/lib/financeCalculator";
import type { CalcProgram, CalcVehicle } from "@/components/financing/FinanceCalculator";

function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-ET", { style: "currency", currency: "ETB", minimumFractionDigits: 0 }).format(
    Math.max(0, Math.round(amount))
  );
}

interface FormState {
  fullName: string;
  phone: string;
  email: string;
}

function ApplyForFinancingContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<CalcVehicle[]>([]);
  const [programs, setPrograms] = useState<CalcProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [vehicleId, setVehicleId] = useState(searchParams.get("vehicle") || "");
  const [programId, setProgramId] = useState(searchParams.get("program") || "");
  const [downPaymentPercent, setDownPaymentPercent] = useState(0);
  const [tenureMonths, setTenureMonths] = useState(0);
  const [form, setForm] = useState<FormState>({ fullName: "", phone: "", email: "" });

  useEffect(() => {
    (async () => {
      try {
        const [vehiclesRes, programsRes] = await Promise.all([
          fetch("/api/public/vehicles"),
          fetch("/api/public/financing-programs"),
        ]);
        const vehiclesData = await vehiclesRes.json().catch(() => []);
        const programsData = await programsRes.json().catch(() => []);
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData?.vehicles || []);
        setPrograms(Array.isArray(programsData) ? programsData : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // hidePrice is for browsing pages only — a financing application inherently
  // needs the real price, same exception as the Finance Calculator/Configurator.
  const priceableVehicles = useMemo(() => vehicles.filter((v) => v.finalPrice || v.basePrice), [vehicles]);
  const vehicle = priceableVehicles.find((v) => v.id === vehicleId) ?? priceableVehicles[0];
  const vehiclePrice = vehicle ? Number(vehicle.finalPrice || vehicle.basePrice || 0) : 0;

  const matchingPrograms = useMemo(
    () => programs.filter((p) => p.appliesToAllVehicles || p.vehicleId === vehicle?.id),
    [programs, vehicle?.id]
  );
  const program = matchingPrograms.find((p) => p.id === programId) ?? matchingPrograms[0];

  useEffect(() => {
    if (!vehicle && priceableVehicles[0]) setVehicleId(priceableVehicles[0].id);
  }, [vehicle, priceableVehicles]);

  useEffect(() => {
    if (!program) return;
    if (!matchingPrograms.some((p) => p.id === programId)) setProgramId(program.id);
    setDownPaymentPercent((current) => current || Number(program.downPaymentPercent) || 0);
    setTenureMonths((current) => current || program.tenureMonths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program?.id]);

  const result = program
    ? calculateLoan({
        vehiclePrice,
        downPaymentPercent,
        annualInterestRatePercent: Number(program.interestRate) || 0,
        tenureMonths,
      })
    : null;

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vehicle || !program || !result) {
      setError("Please select a vehicle and a financing partner.");
      return;
    }
    if (!form.fullName.trim() || !form.phone.trim()) {
      setError("Please provide your name and phone number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/public/financing-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.fullName,
          customerPhone: form.phone,
          customerEmail: form.email || undefined,
          vehicleId: vehicle.id,
          vehicleModel: vehicle.name,
          vehiclePrice,
          requestedAmount: result.principal,
          downPayment: result.downPaymentAmount,
          tenureMonths,
          interestRate: Number(program.interestRate) || 0,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) throw new Error(data?.error || "Unable to submit your application.");
      setApplicationId(data.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (applicationId) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-20 px-6">
          <div className="max-w-xl w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={42} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">Application Received</h1>
            <p className="text-lg text-steel dark:text-steel-light mb-6">
              Thank you, {form.fullName}. Our finance team will review your application and contact you at{" "}
              {form.phone} shortly.
            </p>
            <div className="bg-ice dark:bg-midnight rounded-xl p-6 text-left text-sm mb-8">
              <div className="flex justify-between gap-4 mb-2">
                <span className="text-steel dark:text-steel-light">Reference</span>
                <strong className="text-navy dark:text-ice font-mono">{applicationId.slice(0, 8).toUpperCase()}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-steel dark:text-steel-light">Status</span>
                <strong className="text-amber-700">Pending Review</strong>
              </div>
            </div>
            <Link href="/" className="inline-block bg-geely-blue text-white font-bold px-8 py-3 hover:bg-navy transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="bg-navy text-white py-14">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10">
          <div className="text-[13px] tracking-[0.2em] text-gold font-bold mb-3 uppercase">Apply for Financing</div>
          <h1 className="disp text-4xl md:text-5xl font-bold mb-4">Financing Application</h1>
          <p className="text-[#d8e4f5] max-w-2xl">
            Tell us what you&apos;re looking for and we&apos;ll match you with a financing partner — no formal quote
            required to get started.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-steel dark:text-steel-light gap-3">
            <LoaderCircle className="animate-spin" size={22} /> Loading...
          </div>
        ) : !vehicle || !program ? (
          <div className="rounded-2xl border border-dashed border-line dark:border-midnight-line p-10 text-center text-steel dark:text-steel-light">
            No active financing programs are available right now — please contact us directly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line shadow-lg overflow-hidden">
            <div className="p-6 space-y-7">
              <div>
                <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">1. Vehicle &amp; Financing Partner</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight-surface outline-none focus:ring-2 focus:ring-geely-blue">
                    {priceableVehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                  <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight-surface outline-none focus:ring-2 focus:ring-geely-blue">
                    {matchingPrograms.map((p) => (
                      <option key={p.id} value={p.id}>{p.bank.name} — {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">2. Loan Terms</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5 text-sm">
                      <span className="text-steel dark:text-steel-light">Down payment</span>
                      <strong className="text-navy dark:text-ice tabular-nums">
                        {downPaymentPercent.toFixed(0)}% &middot; {result && formatETB(result.downPaymentAmount)}
                      </strong>
                    </div>
                    <input
                      type="range"
                      min={Number(program.minDownPaymentPercent)}
                      max={Number(program.maxDownPaymentPercent)}
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full accent-geely-blue"
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5 text-sm">
                      <span className="text-steel dark:text-steel-light">Loan term</span>
                      <strong className="text-navy dark:text-ice tabular-nums">{tenureMonths} months</strong>
                    </div>
                    <input
                      type="range"
                      min={program.minTenureMonths}
                      max={program.maxTenureMonths}
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full accent-geely-blue"
                    />
                  </div>
                </div>
                {result && (
                  <div className="mt-5 bg-navy text-white rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-[#b9cbe4]">Estimated monthly payment</div>
                      <div className="text-2xl font-bold tabular-nums">{formatETB(result.monthlyPayment)}</div>
                    </div>
                    <div className="text-sm text-[#b9cbe4]">
                      Loan amount <strong className="text-white tabular-nums">{formatETB(result.principal)}</strong> at{" "}
                      {Number(program.interestRate).toFixed(2)}% p.a.
                    </div>
                  </div>
                )}
                {program.finePrint && <p className="text-xs text-steel dark:text-steel-light mt-3">{program.finePrint}</p>}
              </div>

              <div>
                <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">3. Your Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Full name *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                  <input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone number *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email address (optional)" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue md:col-span-2" />
                </div>
                {program.eligibilityNote && (
                  <p className="flex items-start gap-2 text-xs text-steel dark:text-steel-light mt-3">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" /> {program.eligibilityNote}
                  </p>
                )}
              </div>

              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
              <button type="submit" disabled={submitting} className="w-full bg-gold text-[#2c2308] font-bold text-base py-4 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? <><LoaderCircle className="animate-spin" size={20} /> Submitting...</> : <>Submit Financing Application <ArrowRight size={20} /></>}
              </button>
              <p className="text-xs text-steel dark:text-steel-light text-center">
                This is a pre-qualification inquiry, not a loan offer — final approval and terms are determined by
                the selected bank.
              </p>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}

export default function ApplyForFinancingPage() {
  return (
    <Suspense fallback={null}>
      <ApplyForFinancingContent />
    </Suspense>
  );
}
