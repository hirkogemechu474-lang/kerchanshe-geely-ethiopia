'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, BadgeDollarSign, Award, CheckCircle2 } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow, Pagination, Modal, ModalActions,
} from '@/components/admin/ui';

interface Commission {
  id: string;
  orderNo: string;
  customerName: string;
  totalPrice: number | null;
  salesAgentId: string | null;
  originalSalesAgentId: string | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  commissionStatus: string;
  commissionSplitPercent: number | null;
  commissionPaidAt: string | null;
  commissionPaymentRef: string | null;
}

interface ListResponse {
  commissions: Commission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function fmt(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return `ETB ${Math.round(value).toLocaleString('en-US')}`;
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Earned', value: 'EARNED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Not Applicable', value: 'NOT_APPLICABLE' },
];

export default function CommissionList() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [actionTarget, setActionTarget] = useState<Commission | null>(null);
  const [actionType, setActionType] = useState<'earned' | 'paid'>('earned');
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) params.set('status', status);
    const res = await fetch(`/api/commission?${params.toString()}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const counts = (data?.commissions ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.commissionStatus] = (acc[c.commissionStatus] || 0) + 1;
    return acc;
  }, {});

  const openAction = (c: Commission, type: 'earned' | 'paid') => {
    setActionType(type);
    setPaymentRef('');
    setMessage('');
    setActionTarget(c);
  };

  const submitAction = async () => {
    if (!actionTarget) return;
    setSubmitting(true);
    setMessage('');
    const body = actionType === 'paid' ? { paymentRef } : {};
    const res = await fetch(`/api/commission/${actionTarget.id}/mark-${actionType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage('Saved successfully.');
      setActionTarget(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to update.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        {STATUS_FILTERS.map((f) => (
          <StatTile
            key={f.value}
            label={f.label}
            value={f.value === '' ? (data?.total ?? 0) : (counts[f.value] ?? 0)}
            icon={BadgeDollarSign}
            active={status === f.value}
            onClick={() => { setStatus(f.value); setPage(1); }}
          />
        ))}
        <Button variant="secondary" size="sm" onClick={load} disabled={loading} className="ml-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <TableCard>
        <THead>
          <Tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Value</Th>
            <Th>Rate</Th>
            <Th>Amount</Th>
            <Th>Split</Th>
            <Th>Status</Th>
            <Th>Reference</Th>
            <Th>Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={9} message="Loading…" />
          ) : !data || data.commissions.length === 0 ? (
            <EmptyTableRow colSpan={9} message="No commissions found." />
          ) : (
            data.commissions.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-gray-900 dark:text-gray-100">{c.orderNo}</Td>
                <Td>{c.customerName}</Td>
                <Td>{fmt(c.totalPrice)}</Td>
                <Td>{c.commissionRate != null ? `${c.commissionRate}%` : '—'}</Td>
                <Td className="font-semibold">{fmt(c.commissionAmount)}</Td>
                <Td>{c.commissionSplitPercent != null ? `${c.commissionSplitPercent}%` : '—'}</Td>
                <Td><Badge tone={statusTone(c.commissionStatus)}>{c.commissionStatus.replace(/_/g, ' ').toUpperCase()}</Badge></Td>
                <Td>{c.commissionPaymentRef || '—'}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {c.commissionStatus === 'NOT_APPLICABLE' && (
                      <Button variant="secondary" size="sm" onClick={() => openAction(c, 'earned')}>
                        <Award className="w-3.5 h-3.5" /> Mark Earned
                      </Button>
                    )}
                    {c.commissionStatus === 'EARNED' && (
                      <Button variant="secondary" size="sm" onClick={() => openAction(c, 'paid')}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}

      {actionTarget && (
        <Modal
          title={actionType === 'paid' ? `Mark ${actionTarget.orderNo} commission as paid` : `Mark ${actionTarget.orderNo} commission as earned`}
          onClose={() => setActionTarget(null)}
        >
          <div className="space-y-4 text-sm">
            {actionType === 'paid' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Reference</label>
                <input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. Payroll #123"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-400 mt-1">Required. Commission must already be EARNED.</p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                Marks this order&apos;s commission as earned ({fmt(actionTarget.commissionAmount)}). This requires a sales agent to be assigned and is typically triggered when payment is confirmed.
              </p>
            )}
            {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setActionTarget(null)}>Cancel</Button>
              <Button size="sm" onClick={submitAction} disabled={submitting || (actionType === 'paid' && !paymentRef)}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}
    </div>
  );
}
