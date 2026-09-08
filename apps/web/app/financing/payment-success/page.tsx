"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchaseId") || "";
  const [purchase, setPurchase] = useState<{ vehicle: string; amount: string; bank: string; transactionId: string; paymentReference: string; paymentStatus: string; purchaseStatus: string } | null>(null);
  useEffect(() => {
    if (!purchaseId) return;
    fetch(`/api/public/purchases/${encodeURIComponent(purchaseId)}`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => setPurchase(data?.purchase || null))
      .catch(() => setPurchase(null));
  }, [purchaseId]);
  return <MainLayout><div className="min-h-[70vh] flex items-center justify-center py-20 px-6"><div className="max-w-2xl w-full text-center"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="text-green-600" size={42} /></div><h1 className="disp text-4xl font-bold text-navy dark:text-ice mb-4">Payment Successful</h1><p className="text-lg text-steel dark:text-steel-light mb-8">Your Geely vehicle payment has been successfully received.</p><div className="bg-ice dark:bg-midnight rounded-xl p-6 text-left space-y-3 mb-8"><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Purchase ID</span><strong className="text-navy dark:text-ice font-mono">{purchaseId}</strong></div>{purchase && <><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Vehicle</span><strong className="text-navy dark:text-ice">{purchase.vehicle}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Amount Paid</span><strong className="text-navy dark:text-ice">{purchase.amount}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Bank</span><strong className="text-navy dark:text-ice">{purchase.bank}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Transaction ID</span><strong className="text-navy dark:text-ice font-mono">{purchase.transactionId}</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Payment Reference</span><strong className="text-navy dark:text-ice font-mono">{purchase.paymentReference}</strong></div></>}<div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Payment Status</span><strong className="text-green-700">Paid</strong></div><div className="flex justify-between gap-4"><span className="text-steel dark:text-steel-light">Purchase Status</span><strong className="text-green-700">Payment Confirmed</strong></div></div><p className="text-sm text-steel dark:text-steel-light mb-6">Our sales team has been notified and will contact you about delivery.</p><Link href="/financing/apply" className="inline-block bg-geely-blue text-white font-bold px-8 py-3 rounded-lg hover:bg-navy transition-all">Back to Purchase</Link></div></div></MainLayout>;
}
