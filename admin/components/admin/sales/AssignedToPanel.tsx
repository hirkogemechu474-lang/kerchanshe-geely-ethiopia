'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SalesRep {
  id: string;
  name: string;
}

export default function AssignedToPanel({
  quotationId,
  assignedTo,
  salesReps,
  canManage,
}: {
  quotationId: string;
  assignedTo: string | null;
  salesReps: SalesRep[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!canManage) {
    return <p className="font-semibold text-gray-900">{assignedTo || 'Unassigned'}</p>;
  }

  const reassign = async (repName: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: repName || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to reassign');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <select
        value={assignedTo || ''}
        disabled={busy}
        onChange={(e) => reassign(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-transparent focus:ring-2 focus:ring-geely-blue disabled:opacity-60"
      >
        <option value="">Unassigned</option>
        {salesReps.map((rep) => (
          <option key={rep.id} value={rep.name}>
            {rep.name}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
