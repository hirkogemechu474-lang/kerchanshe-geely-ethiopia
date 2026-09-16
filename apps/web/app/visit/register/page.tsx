'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { Send, UserRound, AlertCircle } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId') || '';

  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId) {
      setError('Your visit session could not be found. Please scan the QR code again.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/visit/${encodeURIComponent(visitId)}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to register your visit.');
      router.push(`/visit/options?visitId=${encodeURIComponent(visitId)}`);
    } catch (err: any) {
      setError(err.message || 'Unable to register your visit. Please ask the front desk for assistance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="bg-white dark:bg-midnight-surface rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-1">
          <UserRound className="w-6 h-6 text-geely-blue" />
          <h1 className="text-2xl font-bold text-navy dark:text-ice">Welcome!</h1>
        </div>
        <p className="text-steel dark:text-steel-light text-sm mb-6">Just a few details so our team can help you right away.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your name *</label>
            <input
              required
              autoFocus
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="e.g. Abebe Kebede"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Phone number *</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
              placeholder="+251 99 338 9874"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (optional)</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-geely-blue text-white px-8 py-4 font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Continuing…
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Continue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VisitRegisterPage() {
  return (
    <MainLayout>
      <div className="py-16 bg-ice dark:bg-midnight min-h-[70vh]">
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </div>
    </MainLayout>
  );
}
