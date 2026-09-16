'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { CalendarCheck, CheckCircle, AlertCircle } from 'lucide-react';

interface DeliveryScheduleSummary {
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  status: string;
  deliveryScheduledAt: string | null;
  deliveryLocation: string | null;
}

export default function DeliverySchedulePage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const token = useSearchParams().get('token') || '';
  const tokenQs = `token=${encodeURIComponent(token)}`;

  const [order, setOrder] = useState<DeliveryScheduleSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/orders/${orderId}/delivery-schedule?${tokenQs}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Unable to load this order.');
        if (active) {
          setOrder(data);
          if (data.deliveryScheduledAt) setConfirmed(true);
        }
      } catch (err: any) {
        if (active) setLoadError(err.message || 'Unable to load this order.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, tokenQs]);

  const submit = async () => {
    if (!scheduledAt) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/public/orders/${orderId}/delivery-schedule?${tokenQs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to schedule delivery.');
      setOrder((prev) => (prev ? { ...prev, deliveryScheduledAt: data.deliveryScheduledAt } : prev));
      setConfirmed(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to schedule delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-geely-blue/20 border-t-geely-blue rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (loadError || !order) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-navy dark:text-ice mb-2">Something went wrong</h1>
            <p className="text-steel dark:text-steel-light text-sm">{loadError || 'This order could not be found.'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-12 bg-ice dark:bg-midnight min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-midnight-surface rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-1">
              <CalendarCheck className="w-6 h-6 text-geely-blue" />
              <h1 className="text-2xl font-bold text-navy dark:text-ice">Schedule Handover: {order.orderNo}</h1>
            </div>
            <p className="text-steel dark:text-steel-light text-sm mb-6">
              {order.customerName} · {order.vehicleModel}
            </p>

            {confirmed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">Handover Scheduled</h2>
                <p className="text-sm text-steel dark:text-steel-light">
                  {order.deliveryScheduledAt ? new Date(order.deliveryScheduledAt).toLocaleString() : ''}
                  {order.deliveryLocation ? ` · ${order.deliveryLocation}` : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-navy dark:text-ice">
                  Pick a date and time for your handover
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-2 block w-full border border-line dark:border-midnight-line rounded-lg px-4 py-3 text-sm"
                  />
                </label>
                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                <button
                  onClick={() => void submit()}
                  disabled={submitting || !scheduledAt}
                  className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Confirming…' : 'Confirm Handover Time'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
