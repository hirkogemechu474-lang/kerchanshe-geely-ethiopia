'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { JOB_CARD_STATUS_COLORS, JOB_CARD_STATUS_LABELS } from '@/lib/workshop/jobCardStateMachine';
import { Card, Button, Modal, ModalActions } from '@/components/admin/ui';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;

interface BayRow {
  id: string;
  name: string;
  bayType: string;
  status: string;
}

interface JobCardRow {
  id: string;
  jobCardNo: string;
  customerName: string;
  status: string;
  bayId: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  technician: { id: string; name: string } | null;
  bay: { id: string; name: string } | null;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function BayBoard() {
  const [date, setDate] = useState(todayISO());
  const [bays, setBays] = useState<BayRow[]>([]);
  const [jobCards, setJobCards] = useState<JobCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<JobCardRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/workshop/board?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      setBays(data.bays);
      setJobCards(data.jobCards);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const scheduled = jobCards.filter((j) => j.bayId && j.scheduledStart && j.scheduledEnd);
  const unscheduled = jobCards.filter((j) => !j.bayId || !j.scheduledStart || !j.scheduledEnd);

  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  const blockStyle = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const startMin = Math.max(0, (s.getHours() - DAY_START_HOUR) * 60 + s.getMinutes());
    const endMin = Math.min(totalMinutes, (e.getHours() - DAY_START_HOUR) * 60 + e.getMinutes());
    const left = (startMin / totalMinutes) * 100;
    const width = Math.max(2, ((endMin - startMin) / totalMinutes) * 100);
    return { left: `${left}%`, width: `${width}%` };
  };

  const hourMarks = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
        {loading && <span className="text-xs text-gray-400">Refreshing…</span>}
      </div>

      {/* Board */}
      <Card padding="none" className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="flex border-b border-gray-100 text-xs text-gray-400">
            <div className="w-40 shrink-0 px-3 py-2 font-semibold text-gray-500">Bay</div>
            <div className="flex-1 relative flex">
              {hourMarks.map((h) => (
                <div key={h} className="flex-1 px-1 py-2 border-l border-gray-100 text-center">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>
          {bays.map((bay) => (
            <div key={bay.id} className="flex border-b border-gray-50 items-center">
              <div className="w-40 shrink-0 px-3 py-3">
                <div className="text-sm font-medium text-gray-900">{bay.name}</div>
                <div className="text-[10px] text-gray-400 uppercase">{bay.bayType.replace('_', ' ')}</div>
              </div>
              <div className="flex-1 relative h-14 bg-gray-50/40 m-1 rounded">
                {scheduled
                  .filter((j) => j.bayId === bay.id)
                  .map((j) => (
                    <Link
                      key={j.id}
                      href={`/admin/workshop/job-cards/${j.id}`}
                      title={`${j.jobCardNo} — ${j.customerName} (${JOB_CARD_STATUS_LABELS[j.status as keyof typeof JOB_CARD_STATUS_LABELS]})`}
                      style={blockStyle(j.scheduledStart!, j.scheduledEnd!)}
                      className={`absolute top-1.5 bottom-1.5 rounded-md px-2 py-1 text-[11px] font-medium overflow-hidden whitespace-nowrap ${JOB_CARD_STATUS_COLORS[j.status as keyof typeof JOB_CARD_STATUS_COLORS]}`}
                    >
                      {j.jobCardNo} · {j.customerName}
                    </Link>
                  ))}
              </div>
            </div>
          ))}
          {bays.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No active bays configured yet.</div>
          )}
        </div>
      </Card>

      {/* Unscheduled / awaiting bay */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Awaiting Bay Assignment ({unscheduled.length})
        </div>
        <div className="divide-y divide-gray-50">
          {unscheduled.map((j) => (
            <div key={j.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-900">{j.jobCardNo}</span>{' '}
                <span className="text-gray-500">{j.customerName}</span>{' '}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${JOB_CARD_STATUS_COLORS[j.status as keyof typeof JOB_CARD_STATUS_COLORS]}`}>
                  {JOB_CARD_STATUS_LABELS[j.status as keyof typeof JOB_CARD_STATUS_LABELS]}
                </span>
              </div>
              <button
                onClick={() => setAssigning(j)}
                className="text-geely-blue hover:text-blue-800 font-medium text-xs"
              >
                Assign bay & time
              </button>
            </div>
          ))}
          {unscheduled.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">Every open job card has a bay slot.</div>
          )}
        </div>
      </Card>

      {assigning && (
        <AssignModal
          jobCard={assigning}
          bays={bays}
          date={date}
          onClose={() => setAssigning(null)}
          onAssigned={() => {
            setAssigning(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function AssignModal({
  jobCard,
  bays,
  date,
  onClose,
  onAssigned,
}: {
  jobCard: JobCardRow;
  bays: BayRow[];
  date: string;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [bayId, setBayId] = useState(jobCard.bayId || '');
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/job-cards/${jobCard.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bayId: bayId || null,
          scheduledStart: bayId ? `${date}T${start}:00` : null,
          scheduledEnd: bayId ? `${date}T${end}:00` : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign bay');
      onAssigned();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Assign ${jobCard.jobCardNo} to a bay`} onClose={onClose}>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Bay</label>
        <select value={bayId} onChange={(e) => setBayId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">— No bay (keep awaiting) —</option>
          {bays.map((b) => (
            <option key={b.id} value={b.id}>{b.name} ({b.bayType.replace('_', ' ')})</option>
          ))}
        </select>
      </div>
      {bayId && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ModalActions>
        <Button onClick={onClose} variant="ghost">Cancel</Button>
        <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Confirm'}</Button>
      </ModalActions>
    </Modal>
  );
}
