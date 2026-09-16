"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, CheckCircle, CreditCard, XCircle } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

interface Payment {
  paymentId: string;
  purchaseId: string;
  paymentReference: string;
  vehicle: string;
  amount: string;
  bank: string;
  status: string;
}

export default function MockPaymentPage() {
  const params = useParams<{ paymentId: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/payments/${params.paymentId}`)
      .then((response) => response.json())
      .then((data) => { if (data.success) setPayment(data.payment); else setError(data.error || "Payment session not found."); })
      .catch(() => setError("Unable to load payment session."))
      .finally(() => setLoading(false));
  }, [params.paymentId]);

  const authorize = async (action?: "cancel" | "fail") => {
    setProcessing(true);
    setError("");
    try {
      const response = await fetch(`/api/payments/${params.paymentId}/authorize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action ? { action } : {}) });
      const result = await response.json();
      if (!response.ok && !result.success) throw new Error(result.error || "Payment failed.");
      if (result.status === "PAID") router.push(`/financing/payment-success?purchaseId=${encodeURIComponent(result.paymentReference)}`);
      else router.push(`/financing/apply?payment=${encodeURIComponent(result.status)}`);
    } catch (authorizationError) {
      setError(authorizationError instanceof Error ? authorizationError.message : "Payment failed.");
      setProcessing(false);
    }
  };

  return <MainLayout><div className="min-h-[70vh] flex items-center justify-center py-16 px-6"><div className="w-full max-w-lg bg-white dark:bg-midnight-surface rounded-2xl border border-line dark:border-midnight-line shadow-xl overflow-hidden">
    <div className="bg-[#123a72] text-white p-7"><div className="flex items-center gap-3"><Building2 className="text-gold" size={30} /><div><div className="text-xl font-bold">{payment?.bank || "Bank Payment"}</div><div className="text-sm text-[#c9dcf5]">Secure Payment</div></div></div></div>
    {loading ? <div className="p-8 text-center text-steel dark:text-steel-light">Loading secure payment session...</div> : payment ? <div className="p-7 space-y-5"><div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">DEMO / SANDBOX PAYMENT</div><div><div className="text-sm text-steel dark:text-steel-light">Geely Ethiopia Vehicle Purchase</div><h1 className="text-2xl font-bold text-navy dark:text-ice mt-1">Authorize Payment</h1></div><div className="space-y-3 rounded-xl bg-ice dark:bg-midnight p-5 text-sm"><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Purchase reference</span><strong className="text-navy dark:text-ice font-mono">{payment.paymentReference}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Vehicle</span><strong className="text-navy dark:text-ice text-right">{payment.vehicle}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Amount</span><strong className="text-navy dark:text-ice text-lg">{payment.amount}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Payment ID</span><strong className="text-navy dark:text-ice font-mono">{payment.paymentId}</strong></div></div>{error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<button type="button" disabled={processing || payment.status === "PAID"} onClick={() => void authorize()} className="w-full flex items-center justify-center gap-2 bg-geely-blue py-4 font-bold text-white hover:bg-navy disabled:opacity-60"><CreditCard size={20} />{processing ? "Authorizing..." : "Authorize Payment"}</button><div className="grid grid-cols-2 gap-3"><button type="button" disabled={processing} onClick={() => void authorize("fail")} className="flex items-center justify-center gap-2 rounded-lg border border-red-200 py-3 text-sm font-bold text-red-700 hover:bg-red-50"><XCircle size={17} />Simulate Failed</button><button type="button" disabled={processing} onClick={() => void authorize("cancel")} className="flex items-center justify-center gap-2 rounded-lg border border-line dark:border-midnight-line py-3 text-sm font-bold text-steel dark:text-steel-light hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight"><XCircle size={17} />Cancel Payment</button></div><p className="text-center text-xs text-steel dark:text-steel-light">This is a development sandbox. Real bank authentication will be used when a provider is configured.</p></div> : <div className="p-8 text-center text-red-700">{error || "Payment session not found."}</div>}
  </div></div></MainLayout>;
}
