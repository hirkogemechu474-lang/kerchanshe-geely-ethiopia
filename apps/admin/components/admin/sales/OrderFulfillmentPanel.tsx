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
  orderNo: string;
  registrationNumber: string | null;
  registeredAt: string | null;
  totalPrice: number | null;
  invoiceNo: string | null;
  invoiceAmount: number | null;
  invoicedAt: string | null;
  vehicleModel: string;
  customerEmail: string | null;
}

// A non-2xx response isn't guaranteed to carry a JSON body (a proxy/timeout
// error, or a route that threw before it could respond, sends one that's
// empty or plain text) — res.json() throws "Unexpected end of JSON input"
// on that, masking the real failure behind a confusing parse error.
async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server error (${res.status}). Please try again.` };
  }
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [invoiceNotice, setInvoiceNotice] = useState('');
  const [accessoriesAmount, setAccessoriesAmount] = useState('0');
  const [otherDescription, setOtherDescription] = useState('');
  const [otherAmount, setOtherAmount] = useState('0');
  // Defaults to 15% of the vehicle price — this used to default to '0',
  // which generateInvoice() converts to null (`Number(vatAmount) || null`),
  // so an invoice generated without someone remembering to fill it in
  // printed the VAT row blank ('—' via fillValue in salesInvoice.pdf.ts).
  // Still editable/clearable for the rare VAT-exempt sale.
  const [vatAmount, setVatAmount] = useState(order.totalPrice ? Math.round(order.totalPrice * 0.15).toString() : '0');
  const [registrationCharge, setRegistrationCharge] = useState('0');
  const [amountPaid, setAmountPaid] = useState(order.totalPrice?.toString() || '0');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  // Auto-generated immediately so the rep never has to type one — mirrors
  // the same "system creates it" behavior as proformaInvoiceNo below.
  const [paymentReferenceNo, setPaymentReferenceNo] = useState(`PAY-${order.orderNo}-${Date.now().toString(36).toUpperCase()}`);
  const [odometerAtDelivery, setOdometerAtDelivery] = useState('0');

  const saveRegistration = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationNumber }),
      });
      const data = await parseJsonResponse(res);
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
      const lineItems = [
        { description: `GEELY vehicle as specified above (${order.vehicleModel})`, qty: 1, unitPrice: order.totalPrice ?? 0, discount: 0 },
        ...(Number(accessoriesAmount) > 0 ? [{ description: 'Accessories / charging equipment', qty: 1, unitPrice: Number(accessoriesAmount), discount: 0 }] : []),
        ...(otherDescription && Number(otherAmount) > 0 ? [{ description: otherDescription, qty: 1, unitPrice: Number(otherAmount), discount: 0 }] : []),
      ];
      const res = await fetch(`/api/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems,
          vatAmount: Number(vatAmount) || null,
          registrationCharge: Number(registrationCharge) || null,
          amountPaid: Number(amountPaid) || null,
          paymentMethod,
          paymentReferenceNo,
          odometerAtDelivery: Number(odometerAtDelivery) || null,
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to generate invoice');
      // A blank payment reference no. gets auto-generated server-side —
      // reflect it back into the field so the sales rep sees what was stamped.
      setPaymentReferenceNo(data.paymentReferenceNo || '');
      setInvoiceNotice(
        order.invoicedAt
          ? ''
          : data.notificationSent
          ? `Invoice emailed to the customer.`
          : `Invoice generated, but the email could not be sent${data.notificationError ? `: ${data.notificationError}` : ' — check SMTP settings.'}`
      );
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resendInvoice = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${order.id}/resend-invoice`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to resend invoice');
      setInvoiceNotice(
        data.notificationSent
          ? 'Invoice re-emailed to the customer.'
          : `Invoice email still could not be sent${data.notificationError ? `: ${data.notificationError}` : ' — check SMTP settings.'}`
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-geely-blue" />
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
              href={`/api/orders/${order.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-geely-blue hover:underline mt-1"
            >
              <FileText className="w-4 h-4" />
              View / Download Invoice PDF
            </a>
            {canManage && (
              <Button
                variant="secondary"
                onClick={resendInvoice}
                disabled={busy || !order.customerEmail}
                className="mt-2"
              >
                Resend Invoice Email
              </Button>
            )}
          </div>
        ) : (
          canManage && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle price (line 1)</label>
                <p className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  {order.totalPrice != null ? `ETB ${order.totalPrice.toLocaleString('en-US')}` : 'To be confirmed'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Accessories / charging equipment (ETB)</label>
                  <input type="number" min={0} value={accessoriesAmount} onChange={(e) => setAccessoriesAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div />
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Other item / service description</label>
                  <input value={otherDescription} onChange={(e) => setOtherDescription(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Other item / service amount (ETB)</label>
                  <input type="number" min={0} value={otherAmount} onChange={(e) => setOtherAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">VAT (ETB)</label>
                  <input type="number" min={0} value={vatAmount} onChange={(e) => setVatAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <p className="mt-1 text-[11px] text-gray-400">Defaults to 15% of the vehicle price — clear it only if this sale is VAT-exempt.</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Registration / plate / other charge (ETB)</label>
                  <input type="number" min={0} value={registrationCharge} onChange={(e) => setRegistrationCharge(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount already paid (ETB)</label>
                  <input type="number" min={0} value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment method</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment reference no.</label>
                  <input
                    value={paymentReferenceNo}
                    onChange={(e) => setPaymentReferenceNo(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Odometer at delivery (km)</label>
                  <input type="number" min={0} value={odometerAtDelivery} onChange={(e) => setOdometerAtDelivery(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
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
