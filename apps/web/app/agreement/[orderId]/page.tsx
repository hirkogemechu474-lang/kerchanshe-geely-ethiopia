'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { FileText, PenLine, Upload, CheckCircle, AlertCircle, CreditCard, Clock } from 'lucide-react';
import { withBasePath } from '@/lib/basePath';

interface OrderSummary {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleModel: string;
  vehicleId: string | null;
  signedDocumentUrl: string | null;
  signedAt: string | null;
  countersignedAt: string | null;
  quotationId: string | null;
  purchaseReference: string | null;
  paymentToken: string | null;
}

export default function AgreementSigningPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const token = useSearchParams().get('token') || '';

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signError, setSignError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/agreement/${orderId}?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Unable to load this agreement.');
        if (active) setOrder(data);
      } catch (err: any) {
        if (active) setLoadError(err.message || 'Unable to load this agreement.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, token]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current!.getContext('2d');
    if (!ctx) return;
    const point = getPoint(e);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current!.x, lastPointRef.current!.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    setHasSignature(true);
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const submitDrawnSignature = async () => {
    if (!canvasRef.current) return;
    setSubmitting(true);
    setSignError('');
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const res = await fetch(`/api/agreement/${orderId}/sign?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'drawn', signatureDataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to submit your signature.');
      setOrder((prev) => (prev ? { ...prev, signedDocumentUrl: data.signedDocumentUrl, signedAt: data.signedAt } : prev));
    } catch (err: any) {
      setSignError(err.message || 'Unable to submit your signature.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    setSignError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'signed-agreements');
      const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) throw new Error(uploadData?.error || 'Upload failed.');

      const res = await fetch(`/api/agreement/${orderId}/sign?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'photo', photoUrl: uploadData.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to submit your signed copy.');
      setOrder((prev) => (prev ? { ...prev, signedDocumentUrl: data.signedDocumentUrl, signedAt: data.signedAt } : prev));
    } catch (err: any) {
      setSignError(err.message || 'Unable to submit your signed copy.');
    } finally {
      setSubmitting(false);
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
            <p className="text-steel dark:text-steel-light text-sm">{loadError || 'This agreement could not be found.'}</p>
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
              <FileText className="w-6 h-6 text-geely-blue" />
              <h1 className="text-2xl font-bold text-navy dark:text-ice">Sales Agreement: {order.orderNo}</h1>
            </div>
            <p className="text-steel dark:text-steel-light text-sm mb-6">
              {order.customerName} · {order.vehicleModel}
            </p>

            <a
              href={withBasePath(`/api/agreement/${orderId}/pdf?token=${encodeURIComponent(token)}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-geely-blue hover:underline mb-8"
            >
              <FileText className="w-4 h-4" />
              View / Download Agreement PDF
            </a>

            {order.signedDocumentUrl ? (
              order.countersignedAt ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">Agreement Signed &amp; Approved</h2>
                  <p className="text-sm text-steel dark:text-steel-light mb-4">
                    Signed {order.signedAt ? new Date(order.signedAt).toLocaleString() : ''}. Thank you, you're ready to continue.
                  </p>
                  <a
                    href={withBasePath(`/api/agreement/${orderId}/pdf?token=${encodeURIComponent(token)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-geely-blue hover:underline mb-6"
                  >
                    <FileText className="w-4 h-4" />
                    View Your Signed Agreement PDF
                  </a>
                  {order.paymentToken && (
                    <div>
                      <Link
                        href={`/payment/order/${order.id}?token=${encodeURIComponent(order.paymentToken)}`}
                        className="inline-flex items-center gap-2 bg-gold text-[#2c2308] font-bold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                        Continue to Payment
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Clock className="w-10 h-10 text-geely-blue mx-auto mb-3" />
                  <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">Agreement Signed</h2>
                  <p className="text-sm text-steel dark:text-steel-light mb-4">
                    Signed {order.signedAt ? new Date(order.signedAt).toLocaleString() : ''}. Your agreement is now under review by our
                    sales manager. We'll email you a payment link as soon as it's approved.
                  </p>
                  <a
                    href={withBasePath(`/api/agreement/${orderId}/pdf?token=${encodeURIComponent(token)}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-geely-blue hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    View Your Signed Agreement PDF
                  </a>
                </div>
              )
            ) : (
              <>
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setMode('draw')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      mode === 'draw' ? 'bg-geely-blue text-white border-geely-blue' : 'border-line dark:border-midnight-line text-navy dark:text-ice hover:bg-ice dark:hover:bg-midnight'
                    }`}
                  >
                    <PenLine className="w-4 h-4" /> Draw Signature
                  </button>
                  <button
                    onClick={() => setMode('upload')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      mode === 'upload' ? 'bg-geely-blue text-white border-geely-blue' : 'border-line dark:border-midnight-line text-navy dark:text-ice hover:bg-ice dark:hover:bg-midnight'
                    }`}
                  >
                    <Upload className="w-4 h-4" /> Upload Signed Copy
                  </button>
                </div>

                {signError && <p className="text-sm text-red-600 mb-4">{signError}</p>}

                {mode === 'draw' ? (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Sign inside the box below with your mouse or finger.</p>
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={180}
                      onPointerDown={startDraw}
                      onPointerMove={draw}
                      onPointerUp={endDraw}
                      onPointerLeave={endDraw}
                      className="w-full h-[180px] border-2 border-dashed border-line dark:border-midnight-line rounded-lg bg-white dark:bg-midnight-surface touch-none"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={clearCanvas}
                        className="text-sm font-semibold text-steel dark:text-steel-light border border-line dark:border-midnight-line px-4 py-2 rounded-lg hover:bg-ice dark:hover:bg-midnight"
                      >
                        Clear
                      </button>
                      <button
                        onClick={submitDrawnSignature}
                        disabled={!hasSignature || submitting}
                        className="flex-1 bg-geely-blue text-white font-bold py-2.5 hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting…' : 'Submit Signature'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">
                      Download the PDF above, print and sign it, then upload a clear photo or scan of the signed page.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={submitPhoto}
                      disabled={submitting}
                      className="block w-full text-sm border border-line dark:border-midnight-line rounded-lg p-3"
                    />
                    {submitting && <p className="text-xs text-steel dark:text-steel-light mt-2">Uploading…</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
