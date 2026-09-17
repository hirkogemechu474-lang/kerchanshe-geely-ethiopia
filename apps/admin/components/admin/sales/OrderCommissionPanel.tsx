'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, type Tone } from '@/components/admin/ui';
import { COMMISSION_STATUS_LABELS } from '@/lib/services/sales/orderStateMachine';
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

// Same assignable-role set as apps/admin/lib/assignSalesRep.ts's
// ASSIGNABLE_ROLES, duplicated here because that module imports
// next/headers (server-only) and can't be pulled into this client
// component. Keep the two lists in sync.
const ASSIGNABLE_ROLES = ['sales', 'sales_manager', 'general_manager', 'admin', 'sales_representative', 'super_admin'];

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
  const [commissionRate, setCommissionRate] = useState(order.commissionRate?.toString() || '5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reps, setReps] = useState<{ id: string; name: string; isActive: boolean }[]>([]);

  useEffect(() => {
    // /api/admin/sales-reps doesn't exist — apps/admin/lib/assignSalesRep.ts's
    // listSalesReps() (used server-side for AssignedToPanel) hits this same
    // /api/admin/users endpoint instead. That backend route only filters by
    // a single exact role (no "in" support), so fetch each assignable role
    // in parallel and merge — same approach as listSalesReps().
    Promise.all(
      ASSIGNABLE_ROLES.map((role) =>
        fetch(`/api/admin/users?role=${role}&pageSize=100`)
          .then((res) => (res.ok ? res.json() : { items: [] }))
          .catch(() => ({ items: [] }))
      )
    ).then((results) => {
      const seen = new Set<string>();
      const merged: { id: string; name: string; isActive: boolean }[] = [];
      for (const data of results) {
        for (const user of (data.items || []) as { id: string; name: string; isActive?: boolean }[]) {
          if (seen.has(user.id)) continue;
          seen.add(user.id);
          merged.push({ id: user.id, name: user.name, isActive: user.isActive !== false });
        }
      }
      merged.sort((a, b) => a.name.localeCompare(b.name));
      setReps(merged);
    });
  }, []);

  const dirty = salesAgentId !== (order.salesAgentId || '') || commissionRate !== (order.commissionRate?.toString() || '5');

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesAgentId, commissionRate: commissionRate === '' ? null : Number(commissionRate) }),
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
      const res = await fetch(`/api/orders/${order.id}/commission/pay`, { method: 'POST' });
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
            {reps.map((rep) => (
              <option key={rep.id} value={rep.id}>
                {rep.name}{!rep.isActive ? ' (inactive)' : ''}
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
