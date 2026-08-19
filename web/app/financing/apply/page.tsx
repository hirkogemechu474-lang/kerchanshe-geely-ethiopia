"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  finalPrice?: number | null;
  hidePrice?: boolean;
  heroImageUrl?: string | null;
}

interface Bank {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface PurchaseForm {
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  color: string;
  quantity: string;
  address: string;
  bankId: string;
  consent: boolean;
}

interface Confirmation {
  purchaseId: string;
  transactionId: string;
  paymentReference: string;
  paymentDate: string;
  status: string;
  checkoutUrl?: string | null;
  paymentId?: string;
  paymentUrl?: string;
}

const formatETB = (value: number) => `ETB ${Math.round(value).toLocaleString("en-US")}`;

export default function VehiclePurchasePage() {
  const searchParams = useSearchParams();
  const quoteReference = searchParams.get("quote") || "";
  const preselectedVehicle = searchParams.get("vehicle") || "";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(preselectedVehicle);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [form, setForm] = useState<PurchaseForm>({
    fullName: "",
    phone: "",
    email: "",
    nationalId: "",
    color: "",
    quantity: "1",
    address: "",
    bankId: "",
    consent: false,
  });

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );
  const quantity = Math.max(1, Number(form.quantity) || 1);
  const purchaseAmount = (selectedVehicle?.finalPrice ?? selectedVehicle?.basePrice ?? 0) * quantity;

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await fetch("/api/public/vehicles");
        const data = await response.json().catch(() => []);
        setVehicles(Array.isArray(data) ? data : data?.vehicles || []);
      } catch {
        setError("Unable to load vehicles. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }
    void loadVehicles();
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setBanks([]);
      setForm((current) => ({ ...current, bankId: "" }));
      return;
    }

    async function loadBanksForVehicle() {
      try {
        const response = await fetch(`/api/public/financing-programs?vehicleId=${encodeURIComponent(selectedVehicleId)}`);
        const programs = await response.json().catch(() => []);
        const uniqueBanks = new Map<string, Bank>();
        (Array.isArray(programs) ? programs : []).forEach((program) => {
          if (program.bank) uniqueBanks.set(program.bank.id, program.bank);
        });
        setBanks(Array.from(uniqueBanks.values()));
        setForm((current) => ({
          ...current,
          bankId: uniqueBanks.has(current.bankId) ? current.bankId : "",
        }));
      } catch {
        setBanks([]);
        setError("Unable to load payment banks for this vehicle.");
      }
    }
    void loadBanksForVehicle();
  }, [selectedVehicleId]);

  const update = (key: keyof PurchaseForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedVehicle || !form.bankId || !form.consent) {
      setError("Please select a vehicle, select a bank, and accept the purchase terms.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/public/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          vehicleId: selectedVehicle.id,
          quantity,
          purchaseAmount,
          paymentMethod: "bank-online",
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to process this purchase.");
      }
      setConfirmation(result.purchase);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to process this purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  const continueToBankPayment = async () => {
    if (!confirmation?.purchaseId) return;
    setInitiatingPayment(true);
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId: confirmation.purchaseId }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.message || result?.error || "Unable to start payment.");
      window.location.href = result.payment.paymentUrl;
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Unable to start payment.");
    } finally {
      setInitiatingPayment(false);
    }
  };

  if (confirmation) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center py-20 px-6">
          <div className="max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-600" size={42} />
            </div>
            <h1 className="disp text-4xl font-bold text-navy mb-4">{confirmation.status === "PAID" ? "Purchase Confirmed!" : "Purchase Received"}</h1>
            <p className="text-lg text-steel mb-8">
              {confirmation.status === "PAID" ? "Thank you for purchasing your Geely vehicle. Your payment has been successfully received." : "Your purchase request is pending payment confirmation from the selected bank."}
            </p>
            <div className="bg-ice rounded-xl p-6 text-left space-y-3 mb-8">
              <div className="flex justify-between gap-4"><span className="text-steel">Purchase ID</span><strong className="text-navy">{confirmation.purchaseId}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-steel">Payment reference</span><strong className="text-navy font-mono">{confirmation.paymentReference}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-steel">Transaction ID</span><strong className="text-navy font-mono">{confirmation.transactionId}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-steel">Payment status</span><strong className={confirmation.status === "PAID" ? "text-green-700" : "text-amber-700"}>{confirmation.status === "PAID" ? "Paid / Payment Confirmed" : "Payment Pending"}</strong></div>
            </div>
            {confirmation.status !== "PAID" && (
              <button type="button" onClick={() => void continueToBankPayment()} disabled={initiatingPayment} className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all mb-4 disabled:opacity-60">
                {initiatingPayment ? "Starting secure payment..." : "Continue to Bank Payment"}
              </button>
            )}
            <p className="text-sm text-steel mb-6">Our sales team will contact you with the next steps for vehicle delivery.</p>
            <Link href="/" className="inline-block bg-geely-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-navy transition-all">Back to Home</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!quoteReference) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-xl rounded-2xl border border-line bg-white p-8 text-center shadow-lg">
            <h1 className="disp mb-4 text-3xl font-bold text-navy">Request a Quote First</h1>
            <p className="mb-7 text-steel leading-relaxed">
              Please complete the quotation form first. After Geely Ethiopia reviews and approves your quote, you will receive a secure link to continue with direct vehicle payment.
            </p>
            <Link href="/quote" className="inline-flex rounded-lg bg-gold px-8 py-4 font-bold text-[#2c2308] hover:bg-opacity-90 transition-all">
              Start Your Quote
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
          <div className="text-[13px] tracking-[0.2em] text-gold font-bold mb-3 uppercase">BUY YOUR GEELY</div>
          <h1 className="disp text-4xl md:text-5xl font-bold mb-4">Purchase Vehicle</h1>
          <p className="text-[#d8e4f5] max-w-2xl">Choose your vehicle, complete your purchase details, and pay directly through your selected bank.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-line shadow-lg overflow-hidden">
          <div className="bg-ice p-6 border-b border-line">
            <h2 className="text-2xl font-bold text-navy">Vehicle Purchase Details</h2>
            <p className="text-sm text-steel mt-1">Your payment is processed as a direct vehicle purchase, not a loan.</p>
          </div>
          <div className="p-6 space-y-7">
            <div>
              <h3 className="text-lg font-bold text-navy mb-4">1. Select Vehicle</h3>
              {loading ? <p className="text-steel">Loading vehicles...</p> : (
                <select required value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)} className="w-full px-4 py-3 border border-line rounded-lg bg-white outline-none focus:ring-2 focus:ring-geely-blue">
                  <option value="">Choose a Geely vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} — {vehicle.hidePrice ? "Price on request" : formatETB(vehicle.finalPrice ?? vehicle.basePrice)}</option>)}
                </select>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-navy mb-4">2. Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Full name *" className="px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone number *" className="px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Email address *" className="px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required value={form.nationalId} onChange={(event) => update("nationalId", event.target.value)} placeholder="National ID / Passport *" className="px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input value={form.color} onChange={(event) => update("color", event.target.value)} placeholder="Preferred color" className="px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required type="number" min="1" max="10" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="Quantity *" className="px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <textarea required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Customer address *" rows={3} className="md:col-span-2 px-4 py-3 border border-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue resize-none" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-navy mb-4">3. Bank Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select required value={form.bankId} onChange={(event) => update("bankId", event.target.value)} disabled={!selectedVehicleId || banks.length === 0} className="px-4 py-3 border border-line rounded-lg bg-white outline-none focus:ring-2 focus:ring-geely-blue disabled:bg-ice">
                  <option value="">{!selectedVehicleId ? "Select a vehicle first" : banks.length ? "Select your bank *" : "No payment banks available"}</option>
                  {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                </select>
                <div className="px-4 py-3 bg-ice rounded-lg flex items-center justify-between gap-4">
                  <span className="text-steel">Exact purchase amount</span>
                  <strong className="text-navy text-lg">
                    {selectedVehicle?.hidePrice ? "Price on request" : formatETB(purchaseAmount)}
                  </strong>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
                <CreditCard className="shrink-0 mt-0.5" size={18} />
                <span>You will be directed to the selected bank payment service to authenticate and complete payment.</span>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-steel">
              <input type="checkbox" required checked={form.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-1 accent-geely-blue" />
              <span>I confirm these purchase details are correct and authorize Geely Ethiopia to process my vehicle purchase and contact me about delivery.</span>
            </label>
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={submitting || !selectedVehicle || !form.bankId} className="w-full bg-gold text-[#2c2308] font-bold text-base py-4 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? <><LoaderCircle className="animate-spin" size={20} /> Processing payment...</> : <>Pay Now / Purchase Vehicle <ShieldCheck size={20} /></>}
            </button>
            <p className="text-xs text-steel text-center">Payment confirmation and your purchase reference will appear after successful payment.</p>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
