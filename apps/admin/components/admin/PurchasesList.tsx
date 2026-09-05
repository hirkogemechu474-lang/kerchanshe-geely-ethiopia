'use client';

import { useEffect, useState } from 'react';

// A "purchase" is a SalesOrder created directly from the public /purchases
// flow (as opposed to one staff converted from a Quotation) — see the
// `direct=true` filter added to GET /api/orders in orders.routes.ts, which
// distinguishes the two using quotationId (null = direct purchase).
interface Purchase {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleModel: string;
  totalPrice: number | null;
  financingStatus: string;
  status: string;
  orderDate: string;
}

function formatMoney(amount: number | null) {
  if (amount === null || amount === undefined) return '-';
  return `ETB ${amount.toLocaleString()}`;
}

function statusTone(status: string) {
  if (['DELIVERED', 'PAID', 'COMPLETED', 'APPROVED', 'DISBURSED'].includes(status)) return 'bg-green-100 text-green-700';
  if (['CANCELLED', 'REJECTED', 'CUSTOMER_DECLINED'].includes(status)) return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export default function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders?direct=true&pageSize=1000')
      .then((response) => response.json())
      .then((data) => setPurchases(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-xl bg-white p-8 text-gray-500">Loading purchases...</div>;
  if (!purchases.length) return <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">No vehicle purchases yet.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr><th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Financing</th><th className="px-4 py-3">Order Status</th><th className="px-4 py-3">Date</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="align-top">
              <td className="px-4 py-4"><div className="font-semibold text-gray-900">{purchase.orderNo}</div></td>
              <td className="px-4 py-4"><div className="font-medium text-gray-900">{purchase.customerName}</div><div className="text-xs text-gray-500">{purchase.customerEmail || '-'}</div><div className="text-xs text-gray-500">{purchase.customerPhone}</div></td>
              <td className="px-4 py-4 text-gray-700">{purchase.vehicleModel}</td>
              <td className="px-4 py-4 font-semibold text-gray-900">{formatMoney(purchase.totalPrice)}</td>
              <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(purchase.financingStatus)}`}>{purchase.financingStatus.replace(/_/g, ' ')}</span></td>
              <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone(purchase.status)}`}>{purchase.status.replace(/_/g, ' ')}</span></td>
              <td className="px-4 py-4 whitespace-nowrap text-gray-500">{new Date(purchase.orderDate).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
