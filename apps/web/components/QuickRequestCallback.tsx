'use client';

import { useState } from 'react';
import { Phone, CheckCircle } from 'lucide-react';

interface QuickRequestCallbackProps {
  vehicleModel?: string;
  className?: string;
  // Use on a dark hero background instead of the default light-page style.
  dark?: boolean;
}

// The "one tap" alternative to the full quote form — just name + phone.
// Posts to /api/public/quick-request, which creates a real Quotation
// (source: 'quick-request') without requiring email/consent/timeframe.
export function QuickRequestCallback({ vehicleModel, className = '', dark = false }: QuickRequestCallbackProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/public/quick-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, vehicleModel }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Unable to submit your request.');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 ${className}`}>
        <CheckCircle size={18} />
        Thanks. A sales consultant will call you back shortly.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          dark
            ? `flex items-center gap-2 text-[#d8e4f5] text-sm hover:text-white transition-colors ${className}`
            : `inline-flex items-center justify-center gap-2 border border-line dark:border-midnight-line text-navy dark:text-ice font-semibold text-sm px-6 py-3 rounded hover:bg-ice dark:hover:bg-midnight transition-all ${className}`
        }
      >
        <Phone size={dark ? 15 : 16} />
        Request a Callback
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        required
        className="flex-1 px-4 py-3 border border-line dark:border-midnight-line rounded-lg text-sm focus:outline-none focus:border-active-blue"
      />
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        required
        className="flex-1 px-4 py-3 border border-line dark:border-midnight-line rounded-lg text-sm focus:outline-none focus:border-active-blue"
      />
      <button
        type="submit"
        disabled={submitting}
        className={`inline-flex items-center justify-center gap-2 bg-black hover:bg-active-blue text-white font-bold text-sm px-6 py-3 transition-all ${
          submitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
        }`}
      >
        {submitting ? 'Sending...' : 'Call Me Back'}
      </button>
      {error && <p className="text-xs text-red-600 sm:self-center">{error}</p>}
    </form>
  );
}
