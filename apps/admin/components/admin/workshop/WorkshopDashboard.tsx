'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Gauge, ClipboardList, Timer, Hourglass, PackageSearch } from 'lucide-react';
import { JOB_CARD_STATUS_COLORS, JOB_CARD_STATUS_LABELS } from '@/lib/services/workshop/jobCardStateMachine';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatTile, Card } from '@/components/admin/ui';
import ReportExportBar from '@/components/admin/reports/ReportExportBar';
import { DashboardReport, statsSection, tableSection } from '@/lib/reportExport';

const REFRESH_MS = 30_000;

const BAY_TILE_COLORS: Record<string, string> = {
  FREE: 'bg-green-50 border-green-200 text-green-700',
  OCCUPIED: 'bg-blue-50 border-blue-200 text-blue-700',
  OUT_OF_SERVICE: 'bg-red-50 border-red-200 text-red-700',
};

interface DashboardData {
  baysBusy: number;
  baysTotal: number;
  jobsToday: number;
  avgTurnaroundMinutes: number | null;
  pendingApproval: number;
  overdueCount: number;
  partsBelowReorder: number;
  bays: { id: string; name: string; bayType: string; status: string; currentJobCard: { jobCardNo: string } | null }[];
  jobCards: {
    id: string;
    jobCardNo: string;
    plateNo: string;
    vehicleModel: string | null;
    customerName: string;
    status: string;
    technicianName: string | null;
    bayName: string | null;
    isOverdue: boolean;
  }[];
  generatedAt: string;
}

function formatMinutes(mins: number | null) {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function buildReport(data: DashboardData): DashboardReport {
  return {
    title: 'Workshop Live Dashboard',
    subtitle: "Real-time bay occupancy, today's jobs, and average turnaround",
    sections: [
      statsSection('Key Performance Indicators', [
        { label: 'Bays Busy', value: `${data.baysBusy} / ${data.baysTotal}` },
        { label: 'Jobs Today', value: data.jobsToday },
        { label: 'Avg. Turnaround', value: formatMinutes(data.avgTurnaroundMinutes) },
        { label: 'Pending Approval', value: data.pendingApproval },
        { label: 'Overdue (3+ days)', value: data.overdueCount },
        { label: 'Parts Below Reorder', value: data.partsBelowReorder },
      ]),
      tableSection(
        'Bay Status Board',
        ['Bay', 'Type', 'Status', 'Current Job'],
        data.bays.map((b) => [b.name, b.bayType, b.status.replace('_', ' '), b.currentJobCard?.jobCardNo ?? '—'])
      ),
      tableSection(
        'Open Job Cards',
        ['Job#', 'Vehicle / Plate', 'Customer', 'Status', 'Technician', 'Bay'],
        data.jobCards.map((j) => [
          j.jobCardNo,
          `${j.vehicleModel || '—'} / ${j.plateNo}`,
          j.customerName,
          JOB_CARD_STATUS_LABELS[j.status as keyof typeof JOB_CARD_STATUS_LABELS] ?? j.status,
          j.technicianName || 'Unassigned',
          j.bayName || '—',
        ])
      ),
    ],
  };
}

export default function WorkshopDashboard({ canExport }: { canExport: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/workshop/dashboard');
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    // Skip ticks while the tab is backgrounded — no one's watching the
    // dashboard, so there's no reason to keep hitting the DB every 30s —
    // and refresh immediately the moment they switch back to it.
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);

  const report = useMemo(() => (data ? buildReport(data) : null), [data]);

  if (!data) return <div className="text-gray-400 text-sm">Loading dashboard…</div>;

  return (
    <div className="space-y-6">
      {canExport && report && (
        <Card>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Download this dashboard</p>
          <ReportExportBar report={report} canExport={canExport} />
        </Card>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatTile label="Bays Busy" value={`${data.baysBusy} / ${data.baysTotal}`} icon={Gauge} />
        <StatTile label="Jobs Today" value={data.jobsToday} icon={ClipboardList} />
        <StatTile label="Avg. Turnaround" value={formatMinutes(data.avgTurnaroundMinutes)} icon={Timer} />
        <StatTile label="Pending Approval" value={data.pendingApproval} icon={Hourglass} tone={data.pendingApproval > 0 ? 'highlight' : 'default'} />
        <StatTile label="Overdue (3+ days)" value={data.overdueCount} icon={AlertTriangle} tone={data.overdueCount > 0 ? 'highlight' : 'default'} />
        <Link href="/admin/spare-parts">
          <StatTile label="Parts Below Reorder" value={data.partsBelowReorder} icon={PackageSearch} tone={data.partsBelowReorder > 0 ? 'highlight' : 'default'} />
        </Link>
      </div>

      {/* Bay status board */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Bay Status Board</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.bays.map((bay) => (
            <div key={bay.id} className={`rounded-lg border p-3 ${BAY_TILE_COLORS[bay.status]}`}>
              <div className="text-sm font-semibold">{bay.name}</div>
              <div className="text-xs opacity-80">
                {bay.status === 'OCCUPIED' && bay.currentJobCard ? bay.currentJobCard.jobCardNo : bay.status.replace('_', ' ')}
              </div>
            </div>
          ))}
          {data.bays.length === 0 && <div className="text-gray-400 text-sm col-span-full">No active bays configured.</div>}
        </div>
      </div>

      {/* Today's job cards */}
      <TableCard>
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900 text-sm">Open Job Cards</div>
        <THead>
          <tr>
            <Th>Job#</Th>
            <Th>Vehicle / Plate</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>Technician</Th>
            <Th>Bay</Th>
          </tr>
        </THead>
        <TBody>
          {data.jobCards.map((j) => (
            <Tr key={j.id}>
              <Td>
                <Link href={`/admin/workshop/job-cards/${j.id}`} className="text-geely-blue font-medium hover:underline">
                  {j.jobCardNo}
                </Link>
                {j.isOverdue && (
                  <span title="Open more than 3 business days" className="ml-1 inline-block align-middle">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-500 inline" />
                  </span>
                )}
              </Td>
              <Td>{j.vehicleModel || '—'} / {j.plateNo}</Td>
              <Td>{j.customerName}</Td>
              <Td>
                <span className={`px-2 py-0.5 rounded-full text-xs ${JOB_CARD_STATUS_COLORS[j.status as keyof typeof JOB_CARD_STATUS_COLORS]}`}>
                  {JOB_CARD_STATUS_LABELS[j.status as keyof typeof JOB_CARD_STATUS_LABELS]}
                </span>
              </Td>
              <Td className="text-gray-500">{j.technicianName || 'Unassigned'}</Td>
              <Td className="text-gray-500">{j.bayName || '—'}</Td>
            </Tr>
          ))}
          {data.jobCards.length === 0 && <EmptyTableRow colSpan={6} message="No open job cards." />}
        </TBody>
      </TableCard>

      <p className="text-xs text-gray-400">Last updated {new Date(data.generatedAt).toLocaleTimeString()} — refreshes every 30 seconds.</p>
    </div>
  );
}
