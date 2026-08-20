'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllowedOrderTransitions,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  FINANCING_STATUS_LABELS,
} from '@/lib/sales/orderStateMachine';
import type { AdminPermissions } from '@/lib/auth/types';
import { Card, Button } from '@/components/admin/ui';
import { ConfigurationSummary } from '@/components/admin/sales/ConfigurationSummary';

interface PdiItem {
  id: string;
  label: string;
  isChecked: boolean;
  checkedAt: string | null;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
}

interface OrderData {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleModel: string;
  configurationJson: unknown;
  totalPrice: number | null;
  financingStatus: string;
  status: string;
  orderDate: string;
  deliveredAt: string | null;
  pdiItems: PdiItem[];
  statusHistory: StatusHistoryEntry[];
  quotation: { id: string } | null;
}

export default function OrderDetail({ order, permissions }: { order: OrderData; permissions: AdminPermissions }) {
  const router = useRouter();
  const [state, setState] = useState(order);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [totalPrice, setTotalPrice] = useState(state.totalPrice?.toString() || '');

  const refresh = async () => {
    const res = await fetch(`/api/admin/orders/${state.id}`);
    if (res.ok) setState((await res.json()).order);
    router.refresh();
  };

  const patchFields = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const transition = async (toStatus: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transition failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const togglePdi = async (itemId: string, isChecked: boolean) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}/pdi`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isChecked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pdiComplete = state.pdiItems.length > 0 && state.pdiItems.every((p) => p.isChecked);
  const allowedTransitions = getAllowedOrderTransitions(state.status as any, { pdiComplete });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{state.orderNo}</h1>
            <p className="text-sm text-gray-500 mt-1">{state.vehicleModel}</p>
            <p className="text-sm text-gray-500">
              {state.customerName} · {state.customerPhone}
              {state.customerEmail ? ` · ${state.customerEmail}` : ''}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[state.status as keyof typeof ORDER_STATUS_COLORS]}`}>
            {ORDER_STATUS_LABELS[state.status as keyof typeof ORDER_STATUS_LABELS]}
          </span>
        </div>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <ConfigurationSummary configuration={state.configurationJson} />

      <Card className="space-y-4">
        <h2 className="font-semibold text-gray-900">Financing &amp; Price</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Financing status</label>
            <select
              value={state.financingStatus}
              onChange={(e) => patchFields({ financingStatus: e.target.value })}
              disabled={!permissions.canManageQuotations || busy}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(FINANCING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total price</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                disabled={!permissions.canManageQuotations}
              />
              {permissions.canManageQuotations && totalPrice !== (state.totalPrice?.toString() || '') && (
                <Button variant="secondary" onClick={() => patchFields({ totalPrice: totalPrice || null })} disabled={busy}>
                  Save
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-gray-900">Pre-Delivery Inspection (PDI)</h2>
        <p className="text-xs text-gray-500">
          Every item must be checked before this order can move to Ready for Delivery.
        </p>
        <ul className="divide-y divide-gray-100">
          {state.pdiItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={(e) => togglePdi(item.id, e.target.checked)}
                disabled={!permissions.canManageQuotations || busy}
                className="w-4 h-4"
              />
              <span className={`text-sm ${item.isChecked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.label}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs font-medium">
          {pdiComplete ? (
            <span className="text-green-600">All items complete</span>
          ) : (
            <span className="text-orange-600">
              {state.pdiItems.filter((p) => p.isChecked).length} / {state.pdiItems.length} complete
            </span>
          )}
        </p>
      </Card>

      {permissions.canManageQuotations && allowedTransitions.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Move Order</h2>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((s) => (
              <Button key={s} variant={s === 'CANCELLED' ? 'ghost' : 'secondary'} onClick={() => transition(s)} disabled={busy}>
                {ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]}
              </Button>
            ))}
          </div>
          {state.status === 'BOOKED' && !pdiComplete && (
            <p className="text-xs text-orange-600 mt-2">
              Complete the PDI checklist above to unlock &quot;Ready for Delivery&quot;.
            </p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Status History</h2>
        <ol className="space-y-2">
          {state.statusHistory.map((h) => (
            <li key={h.id} className="text-sm flex items-center gap-3">
              <span className="text-gray-400 w-40 shrink-0">{new Date(h.changedAt).toLocaleString()}</span>
              <span>
                {h.fromStatus ? `${ORDER_STATUS_LABELS[h.fromStatus as keyof typeof ORDER_STATUS_LABELS]} → ` : ''}
                <strong>{ORDER_STATUS_LABELS[h.toStatus as keyof typeof ORDER_STATUS_LABELS]}</strong>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
