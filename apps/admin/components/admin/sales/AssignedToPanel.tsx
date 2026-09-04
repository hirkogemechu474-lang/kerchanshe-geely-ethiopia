'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle } from 'lucide-react';

interface SalesRep {
  id: string;
  name: string;
}

interface EscalationInfo {
  escalatedAt: string;
  escalatedFrom: string | null;
  escalatedByName: string | null;
  reason: string | null;
}

export default function AssignedToPanel({
  quotationId,
  assignedTo,
  salesReps,
  canManage,
  status,
  escalation,
}: {
  quotationId: string;
  assignedTo: string | null;
  salesReps: SalesRep[];
  canManage: boolean;
  status?: string;
  escalation?: EscalationInfo | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const isClosed = status === 'converted' || status === 'closed';

  const reassign = async (repName: string) => {
    setBusy(true);
    setError('');
    try {
      const rep = salesReps.find((r) => r.name === repName);
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: repName || null, assignedToId: rep?.id || null }),
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

  const escalate = async () => {
    if (!escalateReason.trim()) {
      setError('A reason is required to escalate.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/quotations/${quotationId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: escalateReason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to escalate');
      }
      setShowEscalateForm(false);
      setEscalateReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to escalate');
    } finally {
      setBusy(false);
    }
  };

  if (!canManage) {
    return <p className="font-semibold text-gray-900">{assignedTo || 'Unassigned'}</p>;
  }

  return (
    <div className="space-y-2">
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
      {error && <p className="text-xs text-red-600">{error}</p>}

      {!isClosed && (
        <div>
          {!showEscalateForm ? (
            <button
              type="button"
              onClick={() => setShowEscalateForm(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:underline disabled:opacity-60"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              Escalate to Manager
            </button>
          ) : (
            <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
              <label className="block text-xs font-medium text-orange-900">Reason for escalation</label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-orange-300 px-2 py-1.5 text-sm"
                placeholder="Why does this need a manager's attention?"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={escalate}
                  disabled={busy}
                  className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {busy ? 'Escalating…' : 'Confirm Escalation'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEscalateForm(false); setEscalateReason(''); }}
                  disabled={busy}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {escalation && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
          <p className="font-semibold">
            Escalated {new Date(escalation.escalatedAt).toLocaleString()}
            {escalation.escalatedByName ? ` by ${escalation.escalatedByName}` : ''}
            {escalation.escalatedFrom ? ` (from ${escalation.escalatedFrom})` : ''}
          </p>
          {escalation.reason && <p className="mt-1">Reason: {escalation.reason}</p>}
        </div>
      )}
    </div>
  );
}
