'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PenLine, Upload, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

interface SignatureLinkSummary {
  name: string;
  hasExistingSignature: boolean;
}

export default function SignatureSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    }>
      <SignatureSetupContent />
    </Suspense>
  );
}

function SignatureSetupContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

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
    if (!token) {
      setLoadError('No token provided.');
      setLoading(false);
      return;
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (loadError || !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-gray-600 text-sm mb-6">{loadError || 'This signature setup link could not be found.'}</p>
          <Link href="/admin" className="inline-flex items-center gap-2 text-geely-blue font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-2">
            <PenLine className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Set Up Your Signature</h1>
          </div>
          <p className="text-gray-500 text-sm mb-8">
            Hi {info.name}, this signature will be used automatically whenever you countersign a sales agreement or vehicle handover.
            {info.hasExistingSignature && ' Setting up a new one replaces the signature currently on file.'}
          </p>

          {done ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Signature Saved</h2>
              <p className="text-gray-600 text-sm mb-6">
                You're all set. This signature will now be used automatically when you countersign documents.
              </p>
              <Link href="/admin" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Back to Admin
              </Link>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setMode('draw')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    mode === 'draw' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PenLine className="w-4 h-4" /> Draw Signature
                </button>
                <button
                  onClick={() => setMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    mode === 'upload' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload className="w-4 h-4" /> Upload a Photo
                </button>
              </div>

              {signError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                  {signError}
                </div>
              )}

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
                    className="w-full h-[180px] border-2 border-dashed border-gray-300 rounded-lg bg-white touch-none"
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={clearCanvas}
                      className="text-sm font-semibold text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Clear
                    </button>
                    <button
                      onClick={submitDrawnSignature}
                      disabled={!hasSignature || submitting}
                      className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : 'Save Signature'}
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
                    className="block w-full text-sm border border-gray-300 rounded-lg p-3"
                  />
                  {submitting && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
