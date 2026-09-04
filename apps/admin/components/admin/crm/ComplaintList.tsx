'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, AlertCircle, Plus, MessageSquare, ArrowRight } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow, Pagination, Modal, ModalActions,
} from '@/components/admin/ui';

interface Dashboard {
  open: number; inProgress: number; resolved: number; closed: number;
  critical: number; high: number; totalActive: number;
  byCategory: { category: string; _count: number }[];
}

interface CaseItem {
  id: string;
  caseNo: string;
  customerName: string;
  customerPhone?: string;
  category: string;
  priority: string;
  subject: string;
  source: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
}

interface ListResponse { cases: CaseItem[]; total: number; page: number; pageSize: number; totalPages: number }

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleDateString() : '—'; }

export default function ComplaintList() {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [actionTarget, setActionTarget] = useState<CaseItem | null>(null);
  const [notesTarget, setNotesTarget] = useState<CaseItem | null>(null);
  const [createForm, setCreateForm] = useState({ customerName: '', customerPhone: '', category: 'VEHICLE_ISSUE', priority: 'MEDIUM', subject: '', description: '', source: 'PHONE' });
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [statusNote, setStatusNote] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('INTERNAL');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [dashRes, listRes] = await Promise.all([
      fetch('/api/complaints/dashboard'),
      fetch(`/api/complaints?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`),
    ]);
    if (dashRes.ok) setDash(await dashRes.json());
    if (listRes.ok) setData(await listRes.json());
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const createComplaint = async () => {
    setSubmitting(true); setMessage('');
    const res = await fetch('/api/complaints', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm),
    });
    setSubmitting(false);
    if (res.ok) {
      setShowCreate(false);
      setCreateForm({ customerName: '', customerPhone: '', category: 'VEHICLE_ISSUE', priority: 'MEDIUM', subject: '', description: '', source: 'PHONE' });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to create complaint.');
    }
  };

  const updateStatus = async () => {
    if (!actionTarget) return;
    setSubmitting(true); setMessage('');
    const res = await fetch(`/api/complaints/${actionTarget.id}/status`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
    });
    setSubmitting(false);
    if (res.ok) {
      setActionTarget(null); setStatusNote(''); load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to update status.');
    }
  };

  const addNote = async () => {
    if (!notesTarget) return;
    setSubmitting(true); setMessage('');
    const res = await fetch(`/api/complaints/${notesTarget.id}/notes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteType, content: noteContent }),
    });
    setSubmitting(false);
    if (res.ok) {
      setNotesTarget(null); setNoteContent(''); setNoteType('INTERNAL'); load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to add note.');
    }
  };

  const counts = { open: dash?.open ?? 0, inProgress: dash?.inProgress ?? 0, resolved: dash?.resolved ?? 0, closed: dash?.closed ?? 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <StatTile label="Open" value={counts.open} icon={AlertCircle} active={status === 'OPEN'} onClick={() => { setStatus('OPEN'); setPage(1); }} tone={counts.open > 0 ? 'highlight' : 'default'} />
        <StatTile label="In Progress" value={counts.inProgress} icon={AlertCircle} active={status === 'IN_PROGRESS'} onClick={() => { setStatus('IN_PROGRESS'); setPage(1); }} />
        <StatTile label="Resolved" value={counts.resolved} icon={AlertCircle} active={status === 'RESOLVED'} onClick={() => { setStatus('RESOLVED'); setPage(1); }} />
        <StatTile label="Closed" value={counts.closed} icon={AlertCircle} active={status === 'CLOSED'} onClick={() => { setStatus('CLOSED'); setPage(1); }} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setMessage(''); setShowCreate(true); }}>
            <Plus className="w-4 h-4" /> New Complaint
          </Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {dash && (
        <Card className="flex flex-wrap gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Active by category:</span>
          {dash.byCategory.length === 0 ? (
            <span className="text-gray-400">No open cases.</span>
          ) : dash.byCategory.map((c) => (
            <span key={c.category} className="px-3 py-1 rounded-full bg-geely-blue/10 text-geely-blue dark:bg-geely-blue/20 dark:text-blue-bright font-medium capitalize">
              {c.category.replace(/_/g, ' ').toLowerCase()} ({c._count})
            </span>
          ))}
          {(dash.critical > 0 || dash.high > 0) && (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
              ⚠ {dash.critical} critical / {dash.high} high priority open
            </span>
          )}
        </Card>
      )}

      <TableCard>
        <THead>
          <Tr>
            <Th>Case</Th>
            <Th>Customer</Th>
            <Th>Subject</Th>
            <Th>Category</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={8} message="Loading…" />
          ) : !data || data.cases.length === 0 ? (
            <EmptyTableRow colSpan={8} message="No complaints found." />
          ) : (
            data.cases.map((c) => (
              <Tr key={c.id}>
                <Td className="font-mono text-xs">{c.caseNo}</Td>
                <Td className="font-medium text-gray-900 dark:text-gray-100">{c.customerName}</Td>
                <Td className="max-w-xs truncate">{c.subject}</Td>
                <Td>{c.category.replace(/_/g, ' ').toLowerCase()}</Td>
                <Td><Badge tone={c.priority === 'CRITICAL' || c.priority === 'HIGH' ? 'red' : 'orange'}>{c.priority}</Badge></Td>
                <Td><Badge tone={statusTone(c.status)}>{c.status.replace(/_/g, ' ')}</Badge></Td>
                <Td>{fmtDate(c.createdAt)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => { setNewStatus('IN_PROGRESS'); setStatusNote(''); setMessage(''); setActionTarget(c); }}>
                      <ArrowRight className="w-3.5 h-3.5" /> Status
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setNoteContent(''); setNoteType('INTERNAL'); setMessage(''); setNotesTarget(c); }}>
                      <MessageSquare className="w-3.5 h-3.5" /> Note
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}

      {showCreate && (
        <Modal title="New Complaint" onClose={() => setShowCreate(false)} maxWidth="max-w-lg">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2"><label className="block mb-1">Customer Name</label><input value={createForm.customerName} onChange={(e) => setCreateForm({ ...createForm, customerName: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" /></div>
            <div className="col-span-2"><label className="block mb-1">Customer Phone</label><input value={createForm.customerPhone} onChange={(e) => setCreateForm({ ...createForm, customerPhone: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" /></div>
            <div><label className="block mb-1">Category</label>
              <select value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {['VEHICLE_ISSUE','SERVICE_QUALITY','BILLING','STAFF_CONDUCT','DELIVERY','OTHER'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block mb-1">Priority</label>
              <select value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {['LOW','MEDIUM','HIGH','CRITICAL'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block mb-1">Source</label>
              <select value={createForm.source} onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {['PHONE','EMAIL','WALK_IN','ONLINE','SOCIAL_MEDIA'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className="block mb-1">Subject</label><input value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" /></div>
            <div className="col-span-2"><label className="block mb-1">Description</label><textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" /></div>
            {message && <p className="col-span-2 text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={createComplaint} disabled={submitting || !createForm.customerName || !createForm.subject}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}

      {actionTarget && (
        <Modal title={`Update Status — ${actionTarget.caseNo}`} onClose={() => setActionTarget(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block mb-1">New Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {['OPEN','IN_PROGRESS','PENDING_CUSTOMER','PENDING_INTERNAL','RESOLVED','CLOSED','REOPENED'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">Note (optional)</label>
              <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
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

      {notesTarget && (
        <Modal title={`Add Note — ${notesTarget.caseNo}`} onClose={() => setNotesTarget(null)}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block mb-1">Note Type</label>
              <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2">
                {['INTERNAL','CUSTOMER_COMMUNICATION','RESOLUTION'].map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">Content</label>
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
            </div>
            {message && <p className="text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setNotesTarget(null)}>Cancel</Button>
              <Button size="sm" onClick={addNote} disabled={submitting || !noteContent}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Note'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}
    </div>
  );
}
