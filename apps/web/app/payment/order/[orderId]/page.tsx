'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { CreditCard, Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface OrderPaymentSummary {
  id: string;
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  totalPrice: number | null;
  paymentStatus: 'UNPAID' | 'PENDING_REVIEW' | 'PAID';
  paymentProofUrl: string | null;
}

export default function OrderPaymentPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const token = useSearchParams().get('token') || '';
  const tokenQs = `token=${encodeURIComponent(token)}`;

  const [order, setOrder] = useState<OrderPaymentSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [payingOnline, setPayingOnline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/orders/${orderId}/payment?${tokenQs}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Unable to load this order.');
        if (active) setOrder(data);
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

  const payOnline = async () => {
    setPayingOnline(true);
    setSubmitError('');
    try {
      const res = await fetch(`/api/public/orders/${orderId}/payment/mock-pay?${tokenQs}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to process payment.');
      setOrder((prev) => (prev ? { ...prev, paymentStatus: data.paymentStatus } : prev));
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to process payment.');
    } finally {
      setPayingOnline(false);
    }
  };

  const uploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSubmitError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'payment-proofs');
      const uploadRes = await fetch('/api/upload/document', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) throw new Error(uploadData?.error || 'Upload failed.');

      const res = await fetch(`/api/public/orders/${orderId}/payment/proof?${tokenQs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: uploadData.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to submit your receipt.');
      setOrder((prev) => (prev ? { ...prev, paymentStatus: data.paymentStatus, paymentProofUrl: data.paymentProofUrl } : prev));
    } catch (err: any) {
      setSubmitError(err.message || 'Unable to submit your receipt.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
              <CreditCard className="w-6 h-6 text-geely-blue" />
              <h1 className="text-2xl font-bold text-navy dark:text-ice">Payment: {order.orderNo}</h1>
            </div>
            <p className="text-steel dark:text-steel-light text-sm mb-6">
              {order.customerName} · {order.vehicleModel}
            </p>

            {submitError && <p className="text-sm text-red-600 mb-4">{submitError}</p>}

            {order.paymentStatus === 'PAID' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">Payment Received</h2>
                <p className="text-sm text-steel dark:text-steel-light">Thank you, your payment has been recorded.</p>
              </div>
            ) : order.paymentStatus === 'PENDING_REVIEW' ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Clock className="w-10 h-10 text-geely-blue mx-auto mb-3" />
                <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">Receipt Submitted</h2>
                <p className="text-sm text-steel dark:text-steel-light">
                  Your bank-transfer receipt is being reviewed by our team. We'll update your order once it's confirmed.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-navy dark:text-ice mb-2">Pay Online</h2>
                  <button
                    onClick={() => void payOnline()}
                    disabled={payingOnline}
                    className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="w-4 h-4" />
                    {payingOnline ? 'Processing…' : 'Pay Now'}
                  </button>
                </div>

                <div className="pt-6 border-t border-line dark:border-midnight-line">
                  <h2 className="text-sm font-semibold text-navy dark:text-ice mb-2">Or Upload a Bank Transfer Receipt</h2>
                  <p className="text-xs text-gray-500 mb-3">
                    Transferred to our bank account directly? Upload a photo or PDF of your receipt for our team to confirm.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={uploadProof}
                    disabled={uploading}
                    className="block w-full text-sm border border-line dark:border-midnight-line rounded-lg p-3"
                  />
                  {uploading && (
                    <p className="text-xs text-steel dark:text-steel-light mt-2 flex items-center gap-1">
                      <Upload className="w-3 h-3" /> Uploading…
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
