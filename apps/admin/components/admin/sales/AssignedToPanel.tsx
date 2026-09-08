'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, Wand2 } from 'lucide-react';

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
  const assignedRepName = assignedTo ? salesReps.find((r) => r.id === assignedTo)?.name : null;

  // `Quotation.assignedTo` stores the rep's user id (every backend reader —
  // assignSalesRep.ts, the quotation detail routes — resolves it via
  // userRepository.findById), not their name. This panel used to send
  // {assignedTo: repName} to a generic PUT /api/quotations/:id, which both
  // 500'd (the PUT also forwarded an assignedToId field that isn't a real
  // column) and, even ignoring that, stored a name where an id belongs —
  // so the dropdown could never match its own selected rep and always fell
  // back to showing "Unassigned". Both fixed by calling the purpose-built
  // assign-rep endpoint with a real id.
  const assign = async (body: { salesRepId?: string; autoAssign?: boolean }) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/quotations/${quotationId}/assign-rep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to assign');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign');
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
    return <p className="font-semibold text-gray-900">{assignedRepName || 'Unassigned'}</p>;
  }

  return (
    <div className="space-y-2">
      <select
        value={assignedTo || ''}
        disabled={busy}
        onChange={(e) => {
          // The backend's assign-rep endpoint has no "clear assignment"
          // mode — an empty salesRepId falls through to its own auto-assign
          // branch instead of unassigning. Picking the placeholder option
          // back is therefore a no-op here rather than a surprise
          // auto-assign; a real rep must be picked (or Auto-Assign used
          // deliberately) to change who's assigned.
          if (!e.target.value) return;
          assign({ salesRepId: e.target.value });
        }}
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-transparent focus:ring-2 focus:ring-geely-blue disabled:opacity-60"
      >
        <option value="">Unassigned</option>
        {salesReps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => assign({ autoAssign: true })}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-geely-blue hover:underline disabled:opacity-60"
      >
        <Wand2 className="h-3.5 w-3.5" />
        {busy ? 'Assigning…' : 'Auto-Assign Best Rep'}
      </button>
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
