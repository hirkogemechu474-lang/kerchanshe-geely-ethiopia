'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { ClipboardCheck, Receipt, FileText } from 'lucide-react';

// "PDI -> Registration -> Invoice -> Payment -> Delivery" — the two gates
// (registration recorded, invoice generated) an order needs before it can
// move to DELIVERED, enforced in orderStateMachine.ts alongside PDI/
// agreement. Grouped in one panel since both are simple, related
// fulfillment steps handled together in practice.
interface OrderFulfillmentData {
  id: string;
  registrationNumber: string | null;
  registeredAt: string | null;
  totalPrice: number | null;
  invoiceNo: string | null;
  invoiceAmount: number | null;
  invoicedAt: string | null;
}

export default function OrderFulfillmentPanel({
  order,
  canManage,
  onUpdated,
}: {
  order: OrderFulfillmentData;
  canManage: boolean;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [registrationNumber, setRegistrationNumber] = useState(order.registrationNumber || '');
  const [invoiceAmount, setInvoiceAmount] = useState(order.totalPrice?.toString() || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invoiceNotice, setInvoiceNotice] = useState('');

  const saveRegistration = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const generateInvoice = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceAmount: invoiceAmount || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate invoice');
      setInvoiceNotice(
        order.invoicedAt
          ? ''
          : data.notificationSent
          ? `Invoice emailed to the customer.`
          : 'Invoice generated, but the email could not be sent — check SMTP settings.'
      );
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Registration &amp; Invoice</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle registration number</label>
        <div className="flex gap-2">
          <input
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            disabled={!canManage}
            placeholder="e.g. AA-12345"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          {canManage && registrationNumber !== (order.registrationNumber || '') && (
            <Button variant="secondary" onClick={saveRegistration} disabled={busy}>
              Save
            </Button>
          )}
        </div>
        {order.registeredAt && (
          <p className="text-xs text-gray-400 mt-1">Registered {new Date(order.registeredAt).toLocaleString()}</p>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Sales Invoice</h3>
        </div>

        {invoiceNotice && <p className="text-sm text-blue-700 mb-2">{invoiceNotice}</p>}

        {order.invoicedAt ? (
          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-semibold">{order.invoiceNo}</span> —{' '}
              {order.invoiceAmount != null ? `ETB ${order.invoiceAmount.toLocaleString('en-US')}` : 'Amount to be confirmed'}
            </p>
            <p className="text-xs text-gray-400">Generated {new Date(order.invoicedAt).toLocaleString()}</p>
            <a
              href={`/api/admin/orders/${order.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline mt-1"
            >
              <FileText className="w-4 h-4" />
              View / Download Invoice PDF
            </a>
          </div>
        ) : (
          canManage && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Invoice amount</label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <Button onClick={generateInvoice} disabled={busy}>
                Generate Invoice
              </Button>
            </div>
          )
        )}
      </div>
    </Card>
  );
}
