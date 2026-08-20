'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { CheckCircle, Send, Car } from 'lucide-react';

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
    plateNo: '',
    vin: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

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
    setForm({ plateNo: '', vin: '', customerName: '', customerPhone: '', customerEmail: '' });
  };

  return (
    <MainLayout>
      <div className="py-16 bg-ice min-h-[70vh]">
        <div className="max-w-xl mx-auto px-4">
          {result ? (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-2">You&apos;re checked in!</h1>
              {result.matchedAppointment ? (
                <p className="text-steel mb-6">
                  We found your appointment{result.serviceType ? ` for ${result.serviceType}` : ''} — please take a seat, an advisor will call you shortly.
                </p>
              ) : (
                <p className="text-steel mb-6">Please take a seat — an advisor will call you shortly.</p>
              )}
              <div className="bg-ice rounded-lg p-6 inline-block">
                <p className="text-xs uppercase tracking-wide text-steel">Queue position</p>
                <p className="text-4xl font-bold text-navy">#{result.queuePosition}</p>
                <p className="text-xs text-steel mt-2">Reference {result.jobCardNo}</p>
              </div>
              <div className="mt-6">
                <button onClick={startOver} className="text-sm text-geely-blue font-semibold hover:underline">
                  Check in another vehicle
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-1">
                <Car className="w-6 h-6 text-geely-blue" />
                <h1 className="text-2xl font-bold text-navy">Service Check-in</h1>
              </div>
              <p className="text-steel text-sm mb-6">Enter your details below and we&apos;ll get you in the queue.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">VIN (optional)</label>
                  <input
                    value={form.vin}
                    onChange={(e) => update('vin', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
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
