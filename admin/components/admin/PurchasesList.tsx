'use client';

import { useEffect, useState } from 'react';

interface Purchase {
  id: string;
  from: string;
  email: string;
  content: string;
  createdAt: string;
}

function field(content: string, label: string) {
  return content.split('\n').find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || '-';
}

export default function PurchasesList() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/purchases')
      .then((response) => response.json())
      .then((data) => setPurchases(data.purchases || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-xl bg-white p-8 text-gray-500">Loading purchases...</div>;
  if (!purchases.length) return <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">No vehicle purchases yet.</div>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr><th className="px-4 py-3">Purchase</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Bank</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Order Status</th><th className="px-4 py-3">Date</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {purchases.map((purchase) => {
            const status = field(purchase.content, 'Payment status');
            const purchaseStatus = field(purchase.content, 'Purchase status');
            return <tr key={purchase.id} className="align-top">
              <td className="px-4 py-4"><div className="font-semibold text-gray-900">{field(purchase.content, 'Purchase ID')}</div><div className="font-mono text-xs text-gray-500">{field(purchase.content, 'Payment reference')}</div></td>
              <td className="px-4 py-4"><div className="font-medium text-gray-900">{purchase.from}</div><div className="text-xs text-gray-500">{purchase.email}</div><div className="text-xs text-gray-500">{field(purchase.content, 'Phone')}</div></td>
              <td className="px-4 py-4 text-gray-700">{field(purchase.content, 'Vehicle')}<div className="text-xs text-gray-500">Qty: {field(purchase.content, 'Quantity')}</div></td>
              <td className="px-4 py-4 text-gray-700">{field(purchase.content, 'Bank')}</td>
              <td className="px-4 py-4 font-semibold text-gray-900">{field(purchase.content, 'Purchase amount')}</td>
              <td className="px-4 py-4"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{status}</span><div className="mt-1 font-mono text-[10px] text-gray-500">{field(purchase.content, 'Transaction ID')}</div></td>
              <td className="px-4 py-4 text-xs font-medium text-gray-700">{purchaseStatus}</td>
              <td className="px-4 py-4 whitespace-nowrap text-gray-500">{new Date(purchase.createdAt).toLocaleString()}</td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
