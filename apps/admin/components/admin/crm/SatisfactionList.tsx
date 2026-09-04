'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, Smile, PhoneCall, Star, ThumbsUp } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow, Modal, ModalActions,
} from '@/components/admin/ui';

interface NpsMetrics {
  nps: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  satisfactionAvg: number;
}

interface FollowUp {
  id: string;
  orderId: string;
  orderNo: string;
  customerName: string;
  vehicleModel: string;
  followUpType: string;
  scheduledDate: string;
  assignedTo: string | null;
  status: string;
  notes: string | null;
  npsScore: number | null;
  satisfactionScore: number | null;
  wouldRecommend: boolean | null;
}

const TYPE_LABELS: Record<string, string> = {
  INITIAL_CHECK: 'Initial Check',
  SATISFACTION: 'Satisfaction',
  LOYALTY: 'Loyalty',
  SERVICE_REMINDER: 'Service Reminder',
};

const OUTCOMES = ['COMPLETED', 'NO_ANSWER', 'WRONG_NUMBER', 'REQUESTED_CALLBACK'];

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function SatisfactionList() {
  const [metrics, setMetrics] = useState<NpsMetrics | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<FollowUp | null>(null);
  const [form, setForm] = useState({ outcome: 'COMPLETED', notes: '', npsScore: '', satisfactionScore: '', wouldRecommend: 'true', callbackDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [npsRes, fuRes] = await Promise.all([
      fetch('/api/customer-satisfaction/nps'),
      fetch('/api/customer-satisfaction/follow-ups'),
    ]);
    if (npsRes.ok) setMetrics(await npsRes.json());
    if (fuRes.ok) setFollowUps(await fuRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const complete = async () => {
    if (!target) return;
    setSubmitting(true);
    setMessage('');
    const res = await fetch(`/api/customer-satisfaction/follow-ups/${target.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome: form.outcome,
        notes: form.notes || undefined,
        npsScore: form.npsScore !== '' ? Number(form.npsScore) : undefined,
        satisfactionScore: form.satisfactionScore !== '' ? Number(form.satisfactionScore) : undefined,
        wouldRecommend: form.wouldRecommend === 'true' ? true : form.wouldRecommend === 'false' ? false : undefined,
        callbackDate: form.callbackDate || (form.outcome === 'REQUESTED_CALLBACK' ? form.callbackDate || undefined : undefined),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setTarget(null);
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to complete follow-up.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="NPS Score" value={metrics ? metrics.nps : '—'} icon={ThumbsUp} tone={(metrics?.nps ?? 0) < 0 ? 'highlight' : 'default'} />
        <StatTile label="Promoters" value={metrics?.promoters ?? '—'} icon={Star} />
        <StatTile label="Detractors" value={metrics?.detractors ?? '—'} icon={Star} tone={(metrics?.detractors ?? 0) > 0 ? 'highlight' : 'default'} />
        <StatTile label="Avg Satisfaction" value={metrics ? metrics.satisfactionAvg : '—'} icon={Smile} />
      </div>

      <Card className="text-sm text-gray-600 dark:text-gray-300">
        <p>
          <strong className="text-gray-900 dark:text-gray-100">NPS summary:</strong> {metrics?.total ?? 0} response{((metrics?.total ?? 0) === 1) ? '' : 's'} collected.
          Promoters (9–10): {metrics?.promoters ?? 0} · Passives (7–8): {metrics?.passives ?? 0} · Detractors (0–6): {metrics?.detractors ?? 0}.
        </p>
      </Card>

      <TableCard>
        <THead>
          <Tr>
            <Th>Customer</Th>
            <Th>Order</Th>
            <Th>Vehicle</Th>
            <Th>Type</Th>
            <Th>Scheduled</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={7} message="Loading…" />
          ) : followUps.length === 0 ? (
            <EmptyTableRow colSpan={7} message="No pending follow-ups." />
          ) : (
            followUps.map((f) => (
              <Tr key={f.id}>
                <Td className="font-medium text-gray-900 dark:text-gray-100">{f.customerName}</Td>
                <Td>{f.orderNo}</Td>
                <Td>{f.vehicleModel || '—'}</Td>
                <Td>{TYPE_LABELS[f.followUpType] || f.followUpType.replace(/_/g, ' ')}</Td>
                <Td>{fmtDate(f.scheduledDate)}</Td>
                <Td><Badge tone={statusTone(f.status)}>{f.status.replace(/_/g, ' ')}</Badge></Td>
                <Td>
                  <Button variant="secondary" size="sm" onClick={() => { setForm({ outcome: 'COMPLETED', notes: '', npsScore: '', satisfactionScore: '', wouldRecommend: 'true', callbackDate: '' }); setMessage(''); setTarget(f); }}>
                    <PhoneCall className="w-3.5 h-3.5" /> Complete
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {target && (
        <Modal title={`Complete Follow-up — ${target.customerName}`} onClose={() => setTarget(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">Outcome</label>
              <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {OUTCOMES.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            {form.outcome === 'REQUESTED_CALLBACK' && (
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Callback Date</label>
                <input type="date" value={form.callbackDate} onChange={(e) => setForm({ ...form, callbackDate: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">NPS (0–10)</label>
                <input type="number" min={0} max={10} value={form.npsScore} onChange={(e) => setForm({ ...form, npsScore: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Satisfaction (1–5)</label>
                <input type="number" min={1} max={5} value={form.satisfactionScore} onChange={(e) => setForm({ ...form, satisfactionScore: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Would Recommend</label>
                <select value={form.wouldRecommend} onChange={(e) => setForm({ ...form, wouldRecommend: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-700 dark:text-gray-300">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
            </div>
            {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setTarget(null)}>Cancel</Button>
              <Button size="sm" onClick={complete} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}
    </div>
  );
}
