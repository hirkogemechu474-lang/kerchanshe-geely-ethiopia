'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, type Tone } from '@/components/admin/ui';
import { COMMISSION_STATUS_LABELS } from '@/lib/sales/orderStateMachine';
import { Percent } from 'lucide-react';

// Commission is earned automatically when the order is DELIVERED (see
// .../status route) — this panel is for assigning who earns it and at
// what rate beforehand, and for marking it paid afterward (a separate,
// always-manual accounting step).
interface OrderCommissionData {
  id: string;
  salesAgentId: string | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  commissionStatus: string;
}

const STATUS_TONE: Record<string, Tone> = {
  NOT_APPLICABLE: 'gray',
  PENDING: 'orange',
  EARNED: 'blue',
  PAID: 'green',
};

export default function OrderCommissionPanel({
  order,
  canManage,
  onUpdated,
}: {
  order: OrderCommissionData;
  canManage: boolean;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [salesAgentId, setSalesAgentId] = useState(order.salesAgentId || '');
  const [commissionRate, setCommissionRate] = useState(order.commissionRate?.toString() || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reps, setReps] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/sales-reps')
      .then((res) => (res.ok ? res.json() : { reps: [] }))
      .then((data) => setReps(data.reps || []))
      .catch(() => setReps([]));
  }, []);

  const dirty = salesAgentId !== (order.salesAgentId || '') || commissionRate !== (order.commissionRate?.toString() || '');

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesAgentId, commissionRate: commissionRate === '' ? null : commissionRate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/commission/pay`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark paid');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-geely-blue" />
          <h2 className="text-lg font-semibold text-gray-900">Commission</h2>
        </div>
        <Badge tone={STATUS_TONE[order.commissionStatus] ?? 'gray'}>
          {COMMISSION_STATUS_LABELS[order.commissionStatus] || order.commissionStatus}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sales agent</label>
          <select
            value={salesAgentId}
            onChange={(e) => setSalesAgentId(e.target.value)}
            disabled={!canManage}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {/* Keep a stored name that no longer matches an active rep (e.g. deactivated)
                selectable, rather than silently blanking it. */}
            {salesAgentId && !reps.some((rep) => rep.name === salesAgentId) && (
              <option value={salesAgentId} disabled>
                {salesAgentId} (inactive)
              </option>
            )}
            {reps.map((rep) => (
              <option key={rep.id} value={rep.name}>
                {rep.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Commission rate (%)</label>
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            disabled={!canManage}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {canManage && dirty && (
        <Button variant="secondary" onClick={save} disabled={busy}>
          Save
        </Button>
      )}

      {order.commissionAmount != null && (
        <p className="text-sm text-gray-700">
          Commission amount: <span className="font-semibold">ETB {order.commissionAmount.toLocaleString('en-US')}</span>
        </p>
      )}

      {canManage && order.commissionStatus === 'EARNED' && (
        <Button onClick={markPaid} disabled={busy}>
          Mark Commission Paid
        </Button>
      )}
    </Card>
  );
}
