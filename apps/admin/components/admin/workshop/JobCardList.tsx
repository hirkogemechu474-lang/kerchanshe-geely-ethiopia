'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { JOB_CARD_STATUS_COLORS, JOB_CARD_STATUS_LABELS } from '@/lib/services/workshop/jobCardStateMachine';
import { Card, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow } from '@/components/admin/ui';

interface JobCardRow {
  id: string;
  jobCardNo: string;
  plateNo: string;
  vehicleModel: string | null;
  customerName: string;
  customerPhone: string;
  status: string;
  technicianName: string | null;
  bayName: string | null;
  openTs: string;
}

const STATUSES = Object.keys(JOB_CARD_STATUS_LABELS);

export default function JobCardList({ initialJobCards }: { initialJobCards: JobCardRow[] }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return initialJobCards.filter((j) => {
      if (statusFilter && j.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        j.jobCardNo.toLowerCase().includes(q) ||
        j.plateNo.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.customerPhone.includes(q)
      );
    });
  }, [initialJobCards, statusFilter, query]);

  return (
    <div className="space-y-4">
      <Card padding="sm" className="flex flex-wrap gap-3">
        <input
          placeholder="Search job#, plate, customer, phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{JOB_CARD_STATUS_LABELS[s as keyof typeof JOB_CARD_STATUS_LABELS]}</option>
          ))}
        </select>
      </Card>

      <TableCard>
        <THead>
          <tr>
            <Th>Job#</Th>
            <Th>Vehicle / Plate</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>Technician</Th>
            <Th>Bay</Th>
            <Th>Opened</Th>
          </tr>
        </THead>
        <TBody>
          {filtered.map((j) => (
            <Tr key={j.id}>
              <Td>
                <Link href={`/admin/workshop/job-cards/${j.id}`} className="text-geely-blue font-medium hover:underline">
                  {j.jobCardNo}
                </Link>
              </Td>
              <Td>{j.vehicleModel || '—'} / {j.plateNo}</Td>
              <Td>
                <div className="text-gray-900">{j.customerName}</div>
                <div className="text-xs text-gray-400">{j.customerPhone}</div>
              </Td>
              <Td>
                <span className={`px-2 py-0.5 rounded-full text-xs ${JOB_CARD_STATUS_COLORS[j.status as keyof typeof JOB_CARD_STATUS_COLORS]}`}>
                  {JOB_CARD_STATUS_LABELS[j.status as keyof typeof JOB_CARD_STATUS_LABELS]}
                </span>
              </Td>
              <Td className="text-gray-500">{j.technicianName || 'Unassigned'}</Td>
              <Td className="text-gray-500">{j.bayName || '—'}</Td>
              <Td className="text-gray-500">{new Date(j.openTs).toLocaleString()}</Td>
            </Tr>
          ))}
          {filtered.length === 0 && <EmptyTableRow colSpan={7} message="No job cards match." />}
        </TBody>
      </TableCard>
    </div>
  );
}
