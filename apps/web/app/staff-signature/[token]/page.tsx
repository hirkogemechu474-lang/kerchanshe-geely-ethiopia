'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { PenLine, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface SignatureLinkSummary {
  name: string;
  hasExistingSignature: boolean;
}

// Where the link from admin/app/api/admin/users/[id]/signature-link lands.
// Same draw/upload canvas as the agreement/handover/quotation signing
// pages, but this stores a standalone reusable signature image rather
// than stamping one specific document — see
// web/app/api/staff-signature/[token]/sign/route.ts.
export default function StaffSignaturePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [info, setInfo] = useState<SignatureLinkSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signError, setSignError] = useState('');
  const [done, setDone] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/staff-signature/${token}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Unable to load this link.');
        if (active) setInfo(data);
      } catch (err: any) {
        if (active) setLoadError(err.message || 'Unable to load this link.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

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
      const res = await fetch(`/api/staff-signature/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'drawn', signatureDataUrl }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to save your signature.');
      setDone(true);
    } catch (err: any) {
      setSignError(err.message || 'Unable to save your signature.');
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
      formData.append('category', 'staff-signatures');
      const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) throw new Error(uploadData?.error || 'Upload failed.');

      const res = await fetch(`/api/staff-signature/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'photo', photoUrl: uploadData.url }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to save your signature.');
      setDone(true);
    } catch (err: any) {
      setSignError(err.message || 'Unable to save your signature.');
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

  if (loadError || !info) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-navy dark:text-ice mb-2">Something went wrong</h1>
            <p className="text-steel dark:text-steel-light text-sm">{loadError || 'This link could not be found.'}</p>
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
              <PenLine className="w-6 h-6 text-geely-blue" />
              <h1 className="text-2xl font-bold text-navy dark:text-ice">Set Up Your Signature</h1>
            </div>
            <p className="text-steel dark:text-steel-light text-sm mb-8">
              Hi {info.name}, this signature will be used automatically whenever you countersign a sales agreement or vehicle handover.
              {info.hasExistingSignature && ' Setting up a new one replaces the signature currently on file.'}
            </p>

            {done ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">Signature Saved</h2>
                <p className="text-sm text-steel dark:text-steel-light">
                  You're all set. This signature will now be used automatically when you countersign documents.
                </p>
              </div>
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
                    <Upload className="w-4 h-4" /> Upload a Photo
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
                        className="flex-1 bg-geely-blue text-white font-bold py-2.5 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Saving…' : 'Save Signature'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">
                      Upload a clear photo or scan of your signature on plain paper (a phone photo works fine).
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
