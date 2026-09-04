'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, ScrollText, Clock } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow, Pagination,
} from '@/components/admin/ui';

interface Stats {
  byEntity: { entityType: string; count: number }[];
  byAction: { action: string; count: number }[];
  last24Hours: number;
}

interface Entry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedById: string;
  performedByName?: string | null;
  fromValue?: any;
  toValue?: any;
  reason?: string | null;
  metadata?: any;
  createdAt: string;
}

interface ListResponse { entries: Entry[]; total: number; page: number; pageSize: number; totalPages: number }

function fmtDate(v?: string | null) { return v ? new Date(v).toLocaleString() : '—'; }
function short(v?: string | null) { return v ? `${v.slice(0, 8)}…` : '—'; }

export default function AuditList() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const [statsRes, listRes] = await Promise.all([
      fetch('/api/audit/stats'),
      fetch(`/api/audit/activity?page=${page}&pageSize=50${entityType ? `&entityType=${entityType}` : ''}`),
    ]);
    if (statsRes.ok) setStats(await statsRes.json());
    if (listRes.ok) setData(await listRes.json());
    setLoading(false);
  }, [entityType, page]);

  useEffect(() => { load(); }, [load]);

  const totalCount = stats?.byEntity.reduce((sum, e) => sum + e.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Events" value={totalCount} icon={ScrollText} />
        <StatTile label="Last 24 Hours" value={stats?.last24Hours ?? '—'} icon={Clock} />
        <StatTile label="Recent Actions" value={stats?.byAction.length ?? '—'} icon={ScrollText} />
        <StatTile label="Entities Tracked" value={stats?.byEntity.length ?? '—'} icon={ScrollText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3">Events by Entity</h3>
          {(stats?.byEntity ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No audit data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats?.byEntity.map((e) => (
                <button key={e.entityType} onClick={() => { setEntityType(e.entityType); setPage(1); }} className="w-full flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{e.entityType}</span>
                  <span className="font-medium">{e.count}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Most Common Actions</h3>
          {(stats?.byAction ?? []).length === 0 ? (
            <p className="text-sm text-gray-400">No audit data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats?.byAction.map((a) => (
                <div key={a.action} className="flex justify-between text-sm">
                  <span className="capitalize text-gray-700 dark:text-gray-300">{a.action.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{a.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <TableCard>
        <THead>
          <Tr>
            <Th>Time</Th>
            <Th>Entity</Th>
            <Th>Action</Th>
            <Th>Performed By</Th>
            <Th>Entity ID</Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={5} message="Loading…" />
          ) : !data || data.entries.length === 0 ? (
            <EmptyTableRow colSpan={5} message="No audit activity found." />
          ) : (
            data.entries.map((e) => (
              <Tr key={e.id}>
                <Td className="whitespace-nowrap">{fmtDate(e.createdAt)}</Td>
                <Td><Badge tone={statusTone(e.entityType)}>{e.entityType}</Badge></Td>
                <Td className="capitalize">{e.action.replace(/_/g, ' ')}</Td>
                <Td>{e.performedByName || short(e.performedById)}</Td>
                <Td className="font-mono text-xs">{short(e.entityId)}</Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}
    </div>
  );
}
