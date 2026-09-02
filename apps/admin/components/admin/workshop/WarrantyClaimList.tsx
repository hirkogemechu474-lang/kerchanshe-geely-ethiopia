'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { WARRANTY_CLAIM_STATUS_COLORS, WARRANTY_CLAIM_STATUS_LABELS } from '@/lib/services/workshop/warrantyClaimStateMachine';
import { Card, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow } from '@/components/admin/ui';

interface WarrantyClaimRow {
  id: string;
  claimNo: string;
  defectCode: string;
  status: string;
  createdAt: string;
  jobCardNo: string;
  plateNo: string;
  customerName: string;
}

const STATUSES = Object.keys(WARRANTY_CLAIM_STATUS_LABELS);

export default function WarrantyClaimList({ initialClaims }: { initialClaims: WarrantyClaimRow[] }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return initialClaims.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        c.claimNo.toLowerCase().includes(q) ||
        c.jobCardNo.toLowerCase().includes(q) ||
        c.plateNo.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
      );
    });
  }, [initialClaims, statusFilter, query]);

  return (
    <div className="space-y-4">
      <Card padding="sm" className="flex flex-wrap gap-3">
        <input
          placeholder="Search claim#, job#, plate, customer..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[220px]"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{WARRANTY_CLAIM_STATUS_LABELS[s as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}</option>
          ))}
        </select>
      </Card>

      <TableCard>
        <THead>
          <tr>
            <Th>Claim#</Th>
            <Th>Job Card / Plate</Th>
            <Th>Customer</Th>
            <Th>Defect Code</Th>
            <Th>Status</Th>
            <Th>Created</Th>
          </tr>
        </THead>
        <TBody>
          {filtered.map((c) => (
            <Tr key={c.id}>
              <Td>
                <Link href={`/admin/workshop/warranty-claims/${c.id}`} className="text-geely-blue font-medium hover:underline">
                  {c.claimNo}
                </Link>
              </Td>
              <Td>{c.jobCardNo} / {c.plateNo}</Td>
              <Td className="text-gray-900">{c.customerName}</Td>
              <Td className="text-gray-500">{c.defectCode || '—'}</Td>
              <Td>
                <span className={`px-2 py-0.5 rounded-full text-xs ${WARRANTY_CLAIM_STATUS_COLORS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_COLORS]}`}>
                  {WARRANTY_CLAIM_STATUS_LABELS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}
                </span>
              </Td>
              <Td className="text-gray-500">{new Date(c.createdAt).toLocaleString()}</Td>
            </Tr>
          ))}
          {filtered.length === 0 && <EmptyTableRow colSpan={6} message="No warranty claims match." />}
        </TBody>
      </TableCard>
    </div>
  );
}
