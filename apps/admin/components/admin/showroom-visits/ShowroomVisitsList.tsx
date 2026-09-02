'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Phone, Mail, Calendar, Users, UserCheck, FileText, Car, ShoppingBag } from 'lucide-react';
import { StatTile, Badge, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, Pagination, type Tone } from '@/components/admin/ui';

const PAGE_SIZE = 25;

interface ShowroomVisit {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  selectedAction: string | null;
  quotationId: string | null;
  salesOrderId: string | null;
  testDriveId: string | null;
  createdAt: string;
}

interface Stats {
  total: number;
  started: number;
  registered: number;
  quote: number;
  'test-drive': number;
  purchase: number;
}

const STATUS_LABELS: Record<string, string> = {
  started: 'Scanned (not registered)',
  registered: 'Registered',
  quote: 'Requested a quote',
  'test-drive': 'Booked a test drive',
  purchase: 'Started a purchase',
};

const STATUS_TONE: Record<string, Tone> = {
  started: 'gray',
  registered: 'blue',
  quote: 'orange',
  'test-drive': 'orange',
  purchase: 'green',
};

const TABS: { key: 'all' | keyof Stats; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'started', label: 'Scanned' },
  { key: 'registered', label: 'Registered' },
  { key: 'quote', label: 'Quoted' },
  { key: 'test-drive', label: 'Test Drive' },
  { key: 'purchase', label: 'Purchase' },
];

export default function ShowroomVisitsList() {
  const [visits, setVisits] = useState<ShowroomVisit[] | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, started: 0, registered: 0, quote: 0, 'test-drive': 0, purchase: 0 });
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<(typeof TABS)[number]['key']>('all');
  const [page, setPage] = useState(1);

  const load = useCallback(async (status: string, p: number) => {
    const params = new URLSearchParams({ page: String(p) });
    if (status !== 'all') params.set('status', status);
    const res = await fetch(`/api/admin/showroom-visits?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setVisits(data.visits);
      setStats(data.stats);
      setTotal(data.total);
    }
  }, []);

  useEffect(() => {
    load(filter, page);
  }, [filter, page, load]);

  const changeFilter = (f: (typeof TABS)[number]['key']) => {
    setFilter(f);
    setPage(1);
  };

  if (!visits) return <div className="text-gray-400 text-sm">Loading showroom visits…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Total Visits" value={stats.total} icon={Users} />
        <StatTile label="Registered" value={stats.registered} icon={UserCheck} />
        <StatTile label="Quoted" value={stats.quote} icon={FileText} />
        <StatTile label="Test Drives" value={stats['test-drive']} icon={Car} />
        <StatTile label="Purchases" value={stats.purchase} icon={ShoppingBag} tone={stats.purchase > 0 ? 'highlight' : 'default'} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => changeFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label} ({tab.key === 'all' ? stats.total : stats[tab.key as keyof Stats]})
          </button>
        ))}
      </div>

      <TableCard>
        <THead>
          <tr>
            <Th>Visitor</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
            <Th>Scanned</Th>
            <Th>Produced</Th>
          </tr>
        </THead>
        <TBody>
          {visits.map((visit) => (
            <Tr key={visit.id}>
              <Td>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {visit.fullName || <span className="text-gray-400">Not registered</span>}
                </p>
              </Td>
              <Td>
                <div className="space-y-1">
                  {visit.phone && (
                    <a href={`tel:${visit.phone}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400">
                      <Phone size={14} /> {visit.phone}
                    </a>
                  )}
                  {visit.email && (
                    <a href={`mailto:${visit.email}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400">
                      <Mail size={14} /> {visit.email}
                    </a>
                  )}
                </div>
              </Td>
              <Td>
                <Badge tone={STATUS_TONE[visit.status] ?? 'gray'}>{STATUS_LABELS[visit.status] || visit.status}</Badge>
              </Td>
              <Td className="text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} /> {new Date(visit.createdAt).toLocaleDateString()}
                </div>
              </Td>
              <Td>
                <div className="flex gap-3 items-center text-sm">
                  {visit.quotationId && (
                    <Link href={`/admin/quotations/${visit.quotationId}`} className="text-geely-blue dark:text-blue-400 hover:underline">
                      Quote
                    </Link>
                  )}
                  {visit.salesOrderId && (
                    <Link href={`/admin/orders/${visit.salesOrderId}`} className="text-green-600 dark:text-green-400 hover:underline">
                      Order
                    </Link>
                  )}
                  {visit.testDriveId && (
                    <Link href={`/admin/test-drives/${visit.testDriveId}`} className="text-orange-600 dark:text-orange-400 hover:underline">
                      Test Drive
                    </Link>
                  )}
                  {!visit.quotationId && !visit.salesOrderId && !visit.testDriveId && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </Td>
            </Tr>
          ))}
          {visits.length === 0 && <EmptyTableRow colSpan={5} message="No showroom visits yet." />}
        </TBody>
      </TableCard>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
