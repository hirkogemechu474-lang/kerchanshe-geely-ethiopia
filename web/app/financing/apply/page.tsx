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

interface QuoteSummary {
  id: string;
  reference: string | null;
  vehicleModel: string | null;
  hasFormalPrice: boolean;
  totalPrice: number | null;
  signedAt: string | null;
  signedDocumentUrl: string | null;
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
  // Whether a sales agent has approved the resulting SalesOrder yet — until
  // then, payment cannot proceed (docs/SWMS-INTEGRATION-BACKLOG.md Phase 16).
  approved?: boolean;
}

const formatETB = (value: number) => `ETB ${Math.round(value).toLocaleString("en-US")}`;

export default function VehiclePurchasePage() {
  const searchParams = useSearchParams();
  const quoteReference = searchParams.get("quote") || "";
  const preselectedVehicle = searchParams.get("vehicle") || "";
  // Showroom QR walk-in flow: a visitor arriving here already registered
  // their name/phone/email against a ShowroomVisit row. The `quote` param
  // above only needs to be truthy to pass the "request a quote first" gate
  // below — it isn't validated against a real Quotation record.
  const visitId = searchParams.get("visitId") || "";
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [quote, setQuote] = useState<QuoteSummary | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(preselectedVehicle);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  // Gates the render below while the purchaseId-restore fetch is in
  // flight, so a fresh page load from the "Continue" email link doesn't
  // flash (or, on a slow/failed fetch, get permanently stuck on) the
  // "Request a Quote First" gate before the real confirmation loads.
  const [restoringPurchase, setRestoringPurchase] = useState(() => Boolean(searchParams.get("purchaseId")));
  const [restoreFailed, setRestoreFailed] = useState(false);
  // Direct prefill fallback for entry points with no ShowroomVisit (e.g.
  // the sales-agreement signing page) — passed straight as query params
  // rather than fetched by visitId.
  const [form, setForm] = useState<PurchaseForm>({
    fullName: searchParams.get("name") || "",
    phone: searchParams.get("phone") || "",
    email: searchParams.get("email") || "",
    nationalId: "",
    color: "",
    quantity: "1",
    address: "",
    bankId: "",
    consent: false,
  });

  // Lets a customer land back on their confirmation screen from the
  // "continue" link in their pending-purchase email, instead of losing it
  // the moment they close the tab (the confirmation above only ever lived
  // in this component's local state until now).
  useEffect(() => {
    const restorePurchaseId = searchParams.get("purchaseId");
    if (!restorePurchaseId || confirmation) {
      setRestoringPurchase(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/purchases/${encodeURIComponent(restorePurchaseId)}`);
        const data = await res.json().catch(() => null);
        if (!active) return;
        if (!res.ok || !data?.success) {
          setRestoreFailed(true);
          return;
        }
        setConfirmation({
          purchaseId: data.purchase.purchaseId,
          transactionId: data.purchase.transactionId,
          paymentReference: data.purchase.paymentReference,
          paymentDate: "",
          status: data.purchase.paymentStatus,
          approved: data.purchase.approved,
        });
      } catch {
        if (active) setRestoreFailed(true);
      } finally {
        if (active) setRestoringPurchase(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The `quote` param is the id of a Quotation the customer already
  // requested (see web/app/quote/page.tsx and
  // admin/app/api/admin/quotations/[id]/route.ts, which both generate this
  // link). Once a Sales Consultant has formally priced that quotation
  // (unitPrice set via QuotationPdfPanel) and the customer has e-signed it,
  // that agreed price is what should be charged here — not the vehicle's
  // generic catalog price.
  useEffect(() => {
    if (!quoteReference) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/quotations/by-id/${encodeURIComponent(quoteReference)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !active) return;
        setQuote(data);
      } catch {
        /* silent — falls back to the vehicle's catalog price */
      }
    })();
    return () => {
      active = false;
    };
  }, [quoteReference]);

  useEffect(() => {
    if (!visitId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/visit/${encodeURIComponent(visitId)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok || !active) return;
        setForm((current) => ({
          ...current,
          fullName: data.fullName || current.fullName,
          phone: data.phone || current.phone,
          email: data.email || current.email,
        }));
      } catch {
        /* silent — the form is simply left blank */
      }
    })();
    return () => {
      active = false;
    };
  }, [visitId]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [vehicles, selectedVehicleId]
  );
  const quantity = Math.max(1, Number(form.quantity) || 1);
  // A signed quote's price is a single agreed total for the whole deal —
  // it already accounts for quantity, so it isn't re-multiplied here the
  // way the generic catalog price is.
  const quotedPrice = quote?.hasFormalPrice ? quote.totalPrice : null;
  const purchaseAmount = quotedPrice ?? (selectedVehicle?.finalPrice ?? selectedVehicle?.basePrice ?? 0) * quantity;

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
          quoteReference,
          visitId: visitId || undefined,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to process this purchase.");
      }
      if (visitId) {
        void fetch(`/api/visit/${encodeURIComponent(visitId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedAction: "purchase" }),
        });
      }

      setConfirmation(result.purchase);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to process this purchase.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approval happens later, on the admin side, once a sales agent reviews
  // the order — so this screen polls for it rather than making the customer
  // reload. Once it flips true, the "Continue to Bank Payment" button below
  // (already gated on confirmation.approved) appears without a refresh.
  const checkApprovalStatus = async () => {
    if (!confirmation?.purchaseId || confirmation.approved) return;
    setCheckingApproval(true);
    try {
      const response = await fetch(`/api/public/purchases/${encodeURIComponent(confirmation.purchaseId)}`);
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success && result.purchase?.approved) {
        setConfirmation((current) => (current ? { ...current, approved: true } : current));
      }
    } catch {
      /* silent — the next poll or manual check will retry */
    } finally {
      setCheckingApproval(false);
    }
  };

  useEffect(() => {
    if (!confirmation || confirmation.status === "PAID" || confirmation.approved) return;
    const interval = setInterval(() => void checkApprovalStatus(), 15000);
    return () => clearInterval(interval);
  }, [confirmation?.purchaseId, confirmation?.status, confirmation?.approved]);

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
            <h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">{confirmation.status === "PAID" ? "Purchase Confirmed!" : "Purchase Received"}</h1>
            <p className="text-lg text-steel dark:text-steel-light mb-8">
              {confirmation.status === "PAID" ? "Thank you for purchasing your Geely vehicle. Your payment has been successfully received." : "Your purchase request is pending payment confirmation from the selected bank."}
            </p>
            <div className="bg-ice dark:bg-midnight rounded-xl p-6 text-left space-y-3 mb-8">
              <div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Purchase ID</span><strong className="text-navy dark:text-ice">{confirmation.purchaseId}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Payment reference</span><strong className="text-navy dark:text-ice font-mono">{confirmation.paymentReference}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Transaction ID</span><strong className="text-navy dark:text-ice font-mono">{confirmation.transactionId}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Payment status</span><strong className={confirmation.status === "PAID" ? "text-green-700" : "text-amber-700"}>{confirmation.status === "PAID" ? "Paid / Payment Confirmed" : "Payment Pending"}</strong></div>
            </div>
            {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-left">{error}</div>}
            {confirmation.status !== "PAID" && (
              confirmation.approved ? (
                <div className="mb-4">
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 text-left font-medium">
                    Your order has been approved! Continue below to complete your payment.
                  </div>
                  <button type="button" onClick={() => void continueToBankPayment()} disabled={initiatingPayment} className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-60">
                    {initiatingPayment ? "Starting secure payment..." : "Continue to Bank Payment"}
                  </button>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-left">
                  <p className="mb-3">
                    Your order is pending approval by a sales agent. Once approved, we'll email you a sales agreement to review and sign — you can continue to payment right after that. This page will update automatically once it's approved.
                  </p>
                  <button
                    type="button"
                    onClick={() => void checkApprovalStatus()}
                    disabled={checkingApproval}
                    className="text-amber-900 font-semibold underline hover:no-underline disabled:opacity-60"
                  >
                    {checkingApproval ? "Checking..." : "Continue — check approval status"}
                  </button>
                </div>
              )
            )}
            <p className="text-sm text-steel dark:text-steel-light mb-6">Our sales team will contact you with the next steps for vehicle delivery.</p>
            <Link href="/" className="inline-block bg-geely-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-navy transition-all">Back to Home</Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (restoringPurchase) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
          <div className="flex items-center gap-3 text-steel dark:text-steel-light">
            <LoaderCircle className="animate-spin" size={22} />
            <span>Loading your purchase...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!quoteReference) {
    return (
      <MainLayout>
        <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
          <div className="max-w-xl rounded-2xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface p-8 text-center shadow-lg">
            <h1 className="disp mb-4 text-3xl font-bold text-navy dark:text-ice">Request a Quote First</h1>
            <p className="mb-7 text-steel dark:text-steel-light leading-relaxed">
              {restoreFailed
                ? "We couldn't find that purchase, or it may have expired. Please start a new quote, or check the link from your confirmation email and try again."
                : "Please complete the quotation form first. After Geely Ethiopia reviews and approves your quote, you will receive a secure link to continue with direct vehicle payment."}
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
        <form onSubmit={handleSubmit} className="bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line shadow-lg overflow-hidden">
          <div className="bg-ice dark:bg-midnight p-6 border-b border-line dark:border-midnight-line">
            <h2 className="text-2xl font-bold text-navy dark:text-ice">Vehicle Purchase Details</h2>
            <p className="text-sm text-steel dark:text-steel-light mt-1">Your payment is processed as a direct vehicle purchase, not a loan.</p>
          </div>
          <div className="p-6 space-y-7">
            <div>
              <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">1. Select Vehicle</h3>
              {loading ? <p className="text-steel dark:text-steel-light">Loading vehicles...</p> : (
                <select required value={selectedVehicleId} onChange={(event) => setSelectedVehicleId(event.target.value)} className="w-full px-4 py-3 border border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight-surface outline-none focus:ring-2 focus:ring-geely-blue">
                  <option value="">Choose a Geely vehicle</option>
                  {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} — {vehicle.hidePrice ? "Price on request" : formatETB(vehicle.finalPrice ?? vehicle.basePrice)}</option>)}
                </select>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">2. Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Full name *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required type="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone number *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Email address *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required value={form.nationalId} onChange={(event) => update("nationalId", event.target.value)} placeholder="National ID / Passport *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input value={form.color} onChange={(event) => update("color", event.target.value)} placeholder="Preferred color" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <input required type="number" min="1" max="10" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="Quantity *" className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue" />
                <textarea required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Customer address *" rows={3} className="md:col-span-2 px-4 py-3 border border-line dark:border-midnight-line rounded-lg outline-none focus:ring-2 focus:ring-geely-blue resize-none" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-navy dark:text-ice mb-4">3. Bank Payment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select required value={form.bankId} onChange={(event) => update("bankId", event.target.value)} disabled={!selectedVehicleId || banks.length === 0} className="px-4 py-3 border border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight-surface outline-none focus:ring-2 focus:ring-geely-blue disabled:bg-ice dark:disabled:bg-midnight">
                  <option value="">{!selectedVehicleId ? "Select a vehicle first" : banks.length ? "Select your bank *" : "No payment banks available"}</option>
                  {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
                </select>
                <div className="px-4 py-3 bg-ice dark:bg-midnight rounded-lg flex items-center justify-between gap-4">
                  <span className="text-steel dark:text-steel-light">
                    {quotedPrice != null ? "Your quoted price" : "Exact purchase amount"}
                  </span>
                  <strong className="text-navy dark:text-ice text-lg">
                    {selectedVehicle?.hidePrice && quotedPrice == null ? "Price on request" : formatETB(purchaseAmount)}
                  </strong>
                </div>
              </div>
              {quotedPrice != null && (
                <p className="mt-2 text-xs text-steel dark:text-steel-light">
                  {quote?.signedAt
                    ? `This is the price you signed and agreed to on ${new Date(quote.signedAt).toLocaleDateString()}.`
                    : "This is your quoted price from Geely Ethiopia — sign your quotation to confirm it before paying."}
                  {quote?.signedDocumentUrl && (
                    <>
                      {" "}
                      <a href={quote.signedDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-geely-blue hover:underline font-medium">
                        View your signed quotation
                      </a>
                    </>
                  )}
                  {!quote?.signedDocumentUrl && quote?.reference && (
                    <>
                      {" "}
                      <a href={`/api/public/quotations/${quote.reference}/pdf`} target="_blank" rel="noopener noreferrer" className="text-geely-blue hover:underline font-medium">
                        View quotation PDF
                      </a>
                    </>
                  )}
                </p>
              )}
              <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
                <CreditCard className="shrink-0 mt-0.5" size={18} />
                <span>You will be directed to the selected bank payment service to authenticate and complete payment.</span>
              </div>
            </div>

            <label className="flex items-start gap-3 text-sm text-steel dark:text-steel-light">
              <input type="checkbox" required checked={form.consent} onChange={(event) => update("consent", event.target.checked)} className="mt-1 accent-geely-blue" />
              <span>I confirm these purchase details are correct and authorize Geely Ethiopia to process my vehicle purchase and contact me about delivery.</span>
            </label>
            {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={submitting || !selectedVehicle || !form.bankId} className="w-full bg-gold text-[#2c2308] font-bold text-base py-4 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? <><LoaderCircle className="animate-spin" size={20} /> Processing payment...</> : <>Pay Now / Purchase Vehicle <ShieldCheck size={20} /></>}
            </button>
            <p className="text-xs text-steel dark:text-steel-light text-center">Payment confirmation and your purchase reference will appear after successful payment.</p>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
