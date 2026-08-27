'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CheckCircle, Send, Car, ScanLine, Camera, CircleCheck } from 'lucide-react';

// VINs are always 17 characters (ISO 3779) — used to auto-trigger the
// lookup once a scan (or fast typing) completes, without waiting for the
// customer to press anything.
const VIN_LENGTH = 17;

type VinLookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'found'; plateNo: string; model: string | null; customerName: string; customerPhone: string; customerEmail: string | null };

// BarcodeDetector is a native Chrome/Edge API — no library, no dependency.
// Kiosks without a physical scanner (or on an unsupported browser) simply
// don't see the camera-scan button; typing/hardware-scanning into the VIN
// field always works regardless.
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

export default function ServiceCheckInPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    jobCardNo: string;
    queuePosition: number;
    matchedAppointment: boolean;
    serviceType: string | null;
  } | null>(null);
  const [form, setForm] = useState({
    vin: '',
    plateNo: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });
  const [vinLookup, setVinLookup] = useState<VinLookupState>({ status: 'idle' });
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scanning, setScanning] = useState(false);
  const vinInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setScannerSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  useEffect(() => {
    vinInputRef.current?.focus();
  }, []);

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const lookupVin = useCallback(async (vin: string) => {
    if (vin.length !== VIN_LENGTH) return;
    setVinLookup({ status: 'loading' });
    try {
      const res = await fetch(`/api/service-check-in/lookup?vin=${encodeURIComponent(vin)}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setVinLookup({ status: 'not_found' });
        return;
      }
      setVinLookup({
        status: 'found',
        plateNo: data.plateNo,
        model: data.model,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
      });
      setForm((prev) => ({
        ...prev,
        plateNo: data.plateNo || prev.plateNo,
        customerName: data.customerName || prev.customerName,
        customerPhone: data.customerPhone || prev.customerPhone,
        customerEmail: data.customerEmail || prev.customerEmail,
      }));
    } catch {
      setVinLookup({ status: 'not_found' });
    }
  }, []);

  const handleVinChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/\s/g, '');
    update('vin', cleaned);
    if (vinLookup.status !== 'idle') setVinLookup({ status: 'idle' });
    if (cleaned.length === VIN_LENGTH) lookupVin(cleaned);
  };

  const handleVinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // A keyboard-wedge barcode scanner "types" the code then sends Enter —
    // trigger the lookup immediately rather than waiting on VIN_LENGTH,
    // in case the scanned symbology padded/trimmed a character.
    if (e.key === 'Enter') {
      e.preventDefault();
      lookupVin(form.vin);
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCameraScan = async () => {
    if (!window.BarcodeDetector) return;
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new window.BarcodeDetector({ formats: ['code_39', 'code_128', 'qr_code'] });
      const poll = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const hit = codes.find((c) => c.rawValue && c.rawValue.length >= 11);
          if (hit) {
            const vin = hit.rawValue.toUpperCase().replace(/\s/g, '').slice(0, VIN_LENGTH);
            handleVinChange(vin);
            stopCamera();
            return;
          }
        } catch {
          // transient decode errors are normal mid-scan; keep polling
        }
        if (streamRef.current) requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    } catch {
      setError('Could not access the camera. Please scan with a handheld scanner or enter the VIN manually.');
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/service-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in');
      setResult({
        jobCardNo: data.jobCardNo,
        queuePosition: data.queuePosition,
        matchedAppointment: Boolean(data.matchedAppointment),
        serviceType: data.serviceType || null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to check in. Please ask the front desk for assistance.');
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setResult(null);
    setVinLookup({ status: 'idle' });
    setForm({ vin: '', plateNo: '', customerName: '', customerPhone: '', customerEmail: '' });
    setTimeout(() => vinInputRef.current?.focus(), 0);
  };

  return (
    <MainLayout>
      <div className="py-16 bg-ice dark:bg-midnight min-h-[70vh]">
        <div className="max-w-xl mx-auto px-4">
          {result ? (
            <div className="bg-white dark:bg-midnight-surface rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy dark:text-ice mb-2">You&apos;re checked in!</h1>
              {result.matchedAppointment ? (
                <p className="text-steel dark:text-steel-light mb-6">
                  We found your appointment{result.serviceType ? ` for ${result.serviceType}` : ''} — please take a seat, an advisor will call you shortly.
                </p>
              ) : (
                <p className="text-steel dark:text-steel-light mb-6">Please take a seat — an advisor will call you shortly.</p>
              )}
              <div className="bg-ice dark:bg-midnight rounded-lg p-6 inline-block">
                <p className="text-xs uppercase tracking-wide text-steel">Queue position</p>
                <p className="text-4xl font-bold text-navy dark:text-ice">#{result.queuePosition}</p>
                <p className="text-xs text-steel mt-2">Reference {result.jobCardNo}</p>
              </div>
              <div className="mt-6">
                <button onClick={startOver} className="text-sm text-geely-blue font-semibold hover:underline">
                  Check in another vehicle
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-midnight-surface rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-1">
                <Car className="w-6 h-6 text-geely-blue" />
                <h1 className="text-2xl font-bold text-navy">Service Check-in</h1>
              </div>
              <p className="text-steel text-sm mb-6">Scan your vehicle&apos;s VIN barcode to get started instantly.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-geely-blue" />
                    Scan VIN barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={vinInputRef}
                      value={form.vin}
                      onChange={(e) => handleVinChange(e.target.value)}
                      onKeyDown={handleVinKeyDown}
                      maxLength={VIN_LENGTH}
                      autoComplete="off"
                      className="flex-1 px-4 py-4 text-lg tracking-wider font-mono border-2 border-geely-blue rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                      placeholder="Scan or type 17-character VIN"
                    />
                    {scannerSupported && (
                      <button
                        type="button"
                        onClick={scanning ? stopCamera : startCameraScan}
                        className={`px-4 rounded-lg border-2 flex items-center justify-center ${
                          scanning ? 'border-red-400 text-red-600 bg-red-50' : 'border-geely-blue text-geely-blue hover:bg-ice'
                        }`}
                        title={scanning ? 'Stop camera' : 'Scan with camera'}
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {scanning && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 relative">
                      <video ref={videoRef} className="w-full h-48 object-cover bg-black" muted playsInline />
                      <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white bg-black/50 py-1">
                        Point the camera at the VIN barcode
                      </p>
                    </div>
                  )}

                  {vinLookup.status === 'loading' && <p className="text-xs text-steel dark:text-steel-light mt-2">Looking up your vehicle…</p>}
                  {vinLookup.status === 'found' && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-start gap-2">
                      <CircleCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">
                        Welcome back, {vinLookup.customerName}! We found your {vinLookup.model || 'vehicle'} on file — your details are filled in below.
                      </p>
                    </div>
                  )}
                  {vinLookup.status === 'not_found' && (
                    <p className="text-xs text-steel dark:text-steel-light mt-2">
                      No record for this VIN yet — no problem, just fill in your details below.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plate number *</label>
                  <input
                    required
                    value={form.plateNo}
                    onChange={(e) => update('plateNo', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    placeholder="e.g. AA-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your name *</label>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => update('customerName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone number *</label>
                  <input
                    required
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => update('customerPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => update('customerEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-geely-blue text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking in…
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Check In
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
