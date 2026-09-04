'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, Repeat, Wand2, ArrowRight } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow, Pagination, Modal, ModalActions,
} from '@/components/admin/ui';

interface Pipeline {
  byStatus: { status: string; _count: number }[];
  byType: { opportunityType: string; _count: number }[];
  bySource: { source: string; _count: number }[];
  totalPipelineValue: number;
  totalActiveOpportunities: number;
  wonCount: number;
  conversionRate: number;
}

interface Opp {
  id: string;
  opportunityNo: string;
  customerId: string;
  vehicleId: string | null;
  opportunityType: string;
  targetModel: string | null;
  estimatedBudget: number | null;
  source: string;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  createdAt: string;
}

interface ListResponse { opportunities: Opp[]; total: number; page: number; pageSize: number; totalPages: number }

const STATUS_FILTERS = ['IDENTIFIED', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'EXPIRED'];

function fmtMoney(v?: number | null) { return v != null ? `ETB ${Math.round(v).toLocaleString('en-US')}` : '—'; }
function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleDateString() : '—'; }

export default function RepeatPurchaseList() {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detecting, setDetecting] = useState(false);
  const [actionTarget, setActionTarget] = useState<Opp | null>(null);
  const [newStatus, setNewStatus] = useState('CONTACTED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [pipeRes, listRes] = await Promise.all([
      fetch('/api/repeat-purchase/pipeline'),
      fetch(`/api/repeat-purchase?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`),
    ]);
    if (pipeRes.ok) setPipeline(await pipeRes.json());
    if (listRes.ok) setData(await listRes.json());
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const detect = async () => {
    setDetecting(true);
    const res = await fetch('/api/repeat-purchase/detect', { method: 'POST' });
    setDetecting(false);
    if (res.ok) {
      const r = await res.json();
      setMessage(`Detection complete: ${r.createdCount} new opportunity(ies).`);
      load();
    } else {
      setMessage('Detection failed or no candidates found.');
    }
  };

  const updateStatus = async () => {
    if (!actionTarget) return;
    setSubmitting(true);
    const res = await fetch(`/api/repeat-purchase/${actionTarget.id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
    });
    setSubmitting(false);
    if (res.ok) {
      setActionTarget(null); setNotes(''); load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to update status.');
    }
  };

  const statusCount = (s: string) => {
    const item = pipeline?.byStatus.find((x) => x.status === s);
    return item?._count ?? 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <StatTile label="Active" value={pipeline?.totalActiveOpportunities ?? '—'} icon={Repeat} />
        <StatTile label="Pipeline Value" value={fmtMoney(pipeline?.totalPipelineValue)} icon={Repeat} />
        <StatTile label="Won" value={pipeline?.wonCount ?? '—'} icon={Repeat} />
        <StatTile label="Conversion" value={pipeline ? `${pipeline.conversionRate}%` : '—'} icon={Repeat} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={detect} disabled={detecting}>
            <Wand2 className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} /> Auto-detect
          </Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-geely-blue">{message}</p>}

      {pipeline && (pipeline.byType.length > 0 || pipeline.bySource.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-semibold mb-3">By Type</h3>
            <div className="space-y-2">
              {pipeline.byType.map((t) => (
                <div key={t.opportunityType} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-600 dark:text-gray-300">{t.opportunityType.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="font-medium">{t._count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">By Source</h3>
            <div className="space-y-2">
              {pipeline.bySource.map((s) => (
                <div key={s.source} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-600 dark:text-gray-300">{s.source.replace(/_/g, ' ').toLowerCase()}</span>
                  <span className="font-medium">{s._count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { setStatus(''); setPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-full border ${status === '' ? 'bg-geely-blue text-white' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>All</button>
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-full border ${status === s ? 'bg-geely-blue text-white' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
            {s.replace(/_/g, ' ')} ({statusCount(s)})
          </button>
        ))}
      </div>

      <TableCard>
        <THead>
          <Tr>
            <Th>Opportunity</Th>
            <Th>Type</Th>
            <Th>Target</Th>
            <Th>Budget</Th>
            <Th>Source</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={8} message="Loading…" />
          ) : !data || data.opportunities.length === 0 ? (
            <EmptyTableRow colSpan={8} message='No upgrade opportunities. Run "Auto-detect" to scan service data for candidates.' />
          ) : (
            data.opportunities.map((o) => (
              <Tr key={o.id}>
                <Td className="font-mono text-xs">{o.opportunityNo}</Td>
                <Td className="capitalize">{o.opportunityType.replace(/_/g, ' ').toLowerCase()}</Td>
                <Td>{o.targetModel || '—'}</Td>
                <Td>{fmtMoney(o.estimatedBudget)}</Td>
                <Td className="capitalize">{o.source.replace(/_/g, ' ').toLowerCase()}</Td>
                <Td><Badge tone={statusTone(o.status)}>{o.status.replace(/_/g, ' ')}</Badge></Td>
                <Td>{fmtDate(o.createdAt)}</Td>
                <Td>
                  <Button variant="secondary" size="sm" onClick={() => { setNewStatus('CONTACTED'); setNotes(''); setMessage(''); setActionTarget(o); }}>
                    <ArrowRight className="w-3.5 h-3.5" /> Update
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}

      {actionTarget && (
        <Modal title={`Update Status — ${actionTarget.opportunityNo}`} onClose={() => setActionTarget(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block mb-1">Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">Notes (optional, required for LOST reason)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
            </div>
            {message && <p className="text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setActionTarget(null)}>Cancel</Button>
              <Button size="sm" onClick={updateStatus} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}
    </div>
  );
}
