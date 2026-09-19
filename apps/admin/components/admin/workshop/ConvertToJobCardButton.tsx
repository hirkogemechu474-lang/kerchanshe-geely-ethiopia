'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConvertToJobCardButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const convert = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/service-bookings/${bookingId}/convert-to-job-card`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert');
      // POST /convert-to-job-card responds with the raw JobCard (no
      // `{jobCard}` wrapper) — reading `.jobCard.id` threw here even though
      // the job card was created successfully server-side, leaving the
      // advisor stuck on a "Cannot read properties of undefined" error.
      router.push(`/admin/workshop/job-cards/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (error) return <span className="text-xs text-red-600">{error}</span>;

  return (
    <button
      onClick={convert}
      disabled={busy}
      className="text-xs font-medium text-geely-blue hover:text-blue-800 disabled:opacity-50"
    >
      {busy ? 'Converting…' : 'Convert to Job Card'}
    </button>
  );
}
