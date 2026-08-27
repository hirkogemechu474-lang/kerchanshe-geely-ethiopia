'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { PackageCheck } from 'lucide-react';

// Dedicated handover action — replaces the generic "Move Order" button for
// the READY_FOR_DELIVERY -> DELIVERED transition specifically, so there's
// exactly one way to complete a handover instead of a generic status button
// that sends no customer notification. "Complete Handover" both performs
// the transition (reusing the existing state-machine-gated status route)
// and fires the delivery confirmation email in one action.
interface OrderHandoverData {
  id: string;
  status: string;
  deliveredAt: string | null;
  handoverNotifiedAt: string | null;
  customerEmail: string | null;
  handoverSignedDocumentUrl: string | null;
  handoverSignedAt: string | null;
  handoverCountersignedAt: string | null;
}

async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server error (${res.status}). Please try again.` };
  }
}

export default function OrderHandoverPanel({
  order,
  canManage,
  canCountersign,
  onUpdated,
}: {
  order: OrderHandoverData;
  canManage: boolean;
  canCountersign: boolean;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [signOffBusy, setSignOffBusy] = useState(false);
  const [signOffError, setSignOffError] = useState('');
  const [signOffNotice, setSignOffNotice] = useState('');

  if (order.status !== 'READY_FOR_DELIVERY' && order.status !== 'DELIVERED') {
    return null;
  }

  const sendSignOff = async () => {
    setSignOffBusy(true);
    setSignOffError('');
    setSignOffNotice('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/send-handover-signoff`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Unable to send the handover sign-off link.');
      setSignOffNotice(
        data.notificationSent
          ? `Sign-off link emailed to ${order.customerEmail}.`
          : 'Could not email the sign-off link — check SMTP settings.'
      );
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setSignOffError(err.message);
    } finally {
      setSignOffBusy(false);
    }
  };

  const countersign = async () => {
    setSignOffBusy(true);
    setSignOffError('');
    setSignOffNotice('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/handover-countersign`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Unable to countersign this handover.');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setSignOffError(err.message);
    } finally {
      setSignOffBusy(false);
    }
  };

  const completeHandover = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (order.status !== 'DELIVERED') {
        const statusRes = await fetch(`/api/admin/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toStatus: 'DELIVERED' }),
        });
        const statusData = await parseJsonResponse(statusRes);
        if (!statusRes.ok) throw new Error(statusData.error || 'Unable to mark this order delivered.');
      }

      const emailRes = await fetch(`/api/admin/orders/${order.id}/handover-email`, { method: 'POST' });
      const emailData = await parseJsonResponse(emailRes);
      if (!emailRes.ok) throw new Error(emailData.error || 'Delivered, but the confirmation email failed to send.');

      setNotice(
        order.customerEmail
          ? emailData.notificationSent
            ? `Delivery confirmation emailed to ${order.customerEmail}.`
            : 'Delivered, but the confirmation email could not be sent — check SMTP settings.'
          : 'Delivered. No customer email on file, so no confirmation was sent.'
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
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <PackageCheck className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">Handover</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-blue-700">{notice}</p>}

      {order.status === 'DELIVERED' ? (
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''}
            {order.handoverNotifiedAt && ` · confirmation sent ${new Date(order.handoverNotifiedAt).toLocaleString()}`}
          </p>
          {canManage && (
            <Button variant="secondary" onClick={completeHandover} disabled={busy}>
              {busy ? 'Sending…' : 'Resend Confirmation'}
            </Button>
          )}
        </div>
      ) : (
        canManage && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Marks this order Delivered and
              {order.customerEmail ? ` emails ${order.customerEmail} a delivery confirmation with the invoice attached.` : ' — no customer email is on file, so no confirmation will be emailed.'}
            </p>
            <Button onClick={completeHandover} disabled={busy}>
              {busy ? 'Completing…' : 'Complete Handover'}
            </Button>
          </div>
        )
      )}

      {order.status === 'DELIVERED' && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Customer Sign-Off</h3>
          {signOffError && <p className="text-sm text-red-600">{signOffError}</p>}
          {signOffNotice && <p className="text-sm text-blue-700">{signOffNotice}</p>}

          {!order.handoverSignedDocumentUrl ? (
            canManage && (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Emails the customer a link to confirm receipt of the vehicle (draw a signature or upload a signed printout).
                  {!order.customerEmail && ' No customer email is on file, so no link can be sent.'}
                </p>
                <Button variant="secondary" onClick={sendSignOff} disabled={signOffBusy || !order.customerEmail}>
                  {signOffBusy ? 'Sending…' : 'Send Handover Sign-Off Link'}
                </Button>
              </div>
            )
          ) : (
            <div className="text-sm text-gray-700 space-y-2">
              <p>Customer signed {order.handoverSignedAt ? new Date(order.handoverSignedAt).toLocaleString() : ''}.</p>
              {order.handoverCountersignedAt ? (
                <p className="text-green-600 font-medium">
                  Countersigned {new Date(order.handoverCountersignedAt).toLocaleString()} — handover complete.
                </p>
              ) : canCountersign ? (
                <Button onClick={countersign} disabled={signOffBusy}>
                  {signOffBusy ? 'Countersigning…' : 'Countersign Handover'}
                </Button>
              ) : (
                <p className="text-orange-600">Awaiting manager countersignature.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
