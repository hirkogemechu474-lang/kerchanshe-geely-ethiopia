'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Trash2, Phone, Mail, Calendar, Loader2, ShoppingCart, FileText, Inbox, PhoneCall, CheckCircle2, ShoppingBag, Search, X } from 'lucide-react';
import { StatTile, Badge, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, Pagination, type Tone } from '@/components/admin/ui';

const PAGE_SIZE = 25;

interface Quotation {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  vehicleModel: string | null;
  preferredDealer: string | null;
  message: string | null;
  status: string;
  source: string;
  createdAt: string;
  quotationNo: string | null;
  managerApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  approved: number;
  accepted: number;
  converted: number;
  closed: number;
}

const SOURCE_LABELS: Record<string, string> = {
  'walk-in': 'Walk-in',
  website: 'Website',
  referral: 'Referral',
  phone: 'Phone',
  other: 'Other',
};

const STATUS_TONE: Record<string, Tone> = {
  new: 'red',
  contacted: 'blue',
  in_progress: 'orange',
  approved: 'green',
  accepted: 'purple',
  converted: 'green',
  closed: 'gray',
};

const TABS: { key: 'all' | 'new' | 'contacted' | 'approved' | 'accepted' | 'converted' | 'closed'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'approved', label: 'Approved' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'converted', label: 'Converted' },
  { key: 'closed', label: 'Closed' },
];

export default function QuotationsList() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[] | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, contacted: 0, approved: 0, accepted: 0, converted: 0, closed: 0 });
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<(typeof TABS)[number]['key']>('all');
  const [page, setPage] = useState(1);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async (status: string, p: number, q: string) => {
    const params = new URLSearchParams({ page: String(p) });
    if (status !== 'all') params.set('status', status);
    if (q) params.set('search', q);
    const res = await fetch(`/api/quotations?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setQuotations(data.quotations);
      setStats(data.stats);
      setTotal(data.total);
    }
  }, []);

  useEffect(() => {
    load(filter, page, search);
  }, [filter, page, search, load]);

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const changeFilter = (f: (typeof TABS)[number]['key']) => {
    setFilter(f);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
    if (res.ok) load(filter, page, search);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/quotations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) load(filter, page, search);
  };

  const handleConvertToOrder = async (id: string) => {
    setConvertingId(id);
    try {
      const response = await fetch(`/api/quotations/${id}/convert-to-order`, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        router.push(`/admin/orders/${data.order.id}`);
        return;
      }
      if (response.status === 409 && data.orderId) {
        router.push(`/admin/orders/${data.orderId}`);
        return;
      }
      alert(data.error || 'Failed to create order');
    } catch (error) {
      console.error('Error converting quotation to order:', error);
      alert('Failed to create order');
    } finally {
      setConvertingId(null);
    }
  };

  if (!quotations) return <div className="text-gray-400 text-sm">Loading quotations…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatTile label="Total" value={stats.total} icon={FileText} />
        <StatTile label="New" value={stats.new} icon={Inbox} tone={stats.new > 0 ? 'highlight' : 'default'} />
        <StatTile label="Contacted" value={stats.contacted} icon={PhoneCall} />
        <StatTile label="Converted" value={stats.converted} icon={ShoppingBag} />
        <StatTile label="Closed" value={stats.closed} icon={CheckCircle2} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search customer, phone, email, or vehicle…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-geely-blue/40"
        />
        {searchInput && (
          <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Clear search">
            <X className="w-4 h-4" />
          </button>
        )}
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
            <Th>Customer</Th>
            <Th>Contact</Th>
            <Th>Model</Th>
            <Th>Source</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th>Actions</Th>
          </tr>
        </THead>
        <TBody>
          {quotations.map((quotation) => (
            <Tr key={quotation.id}>
              <Td>
                <p className="font-medium text-gray-900 dark:text-gray-100">{quotation.customerName}</p>
                {quotation.preferredDealer && <p className="text-xs text-gray-400">{quotation.preferredDealer}</p>}
              </Td>
              <Td>
                <div className="space-y-1">
                  <a href={`tel:${quotation.phoneNumber}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400">
                    <Phone size={14} /> {quotation.phoneNumber}
                  </a>
                  {quotation.email && (
                    <a href={`mailto:${quotation.email}`} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-navy dark:hover:text-blue-400">
                      <Mail size={14} /> {quotation.email}
                    </a>
                  )}
                </div>
              </Td>
              <Td>{quotation.vehicleModel || <span className="text-gray-400">General enquiry</span>}</Td>
              <Td>
                <Badge tone="gray">{SOURCE_LABELS[quotation.source] || quotation.source}</Badge>
              </Td>
              <Td>
                <select
                  value={quotation.status}
                  onChange={(e) => handleStatusChange(quotation.id, e.target.value)}
                  className="border-0 rounded-full text-xs font-medium cursor-pointer bg-transparent"
                >
                  {['new', 'contacted', 'in_progress', 'approved', 'accepted', 'converted', 'closed'].map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge tone={STATUS_TONE[quotation.status] ?? 'gray'}>{quotation.status.replace('_', ' ')}</Badge>
                  {quotation.quotationNo && quotation.managerApprovalStatus === 'PENDING' && (
                    <Badge tone="orange">Awaiting approval</Badge>
                  )}
                  {quotation.managerApprovalStatus === 'REJECTED' && <Badge tone="red">Returned</Badge>}
                </div>
              </Td>
              <Td className="text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} /> {new Date(quotation.createdAt).toLocaleDateString()}
                </div>
              </Td>
              <Td>
                <div className="flex gap-3 items-center">
                  <Link href={`/admin/quotations/${quotation.id}`} className="text-geely-blue dark:text-blue-400 hover:underline" title="View">
                    <Eye size={16} />
                  </Link>
                  {(quotation.status === 'approved' || quotation.status === 'accepted' || quotation.status === 'converted') && (
                    <button
                      onClick={() => handleConvertToOrder(quotation.id)}
                      disabled={convertingId === quotation.id}
                      className="text-green-600 hover:text-green-800 disabled:opacity-50"
                      title="Convert to order"
                    >
                      {convertingId === quotation.id ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                    </button>
                  )}
                  <button onClick={() => handleDelete(quotation.id)} className="text-red-600 hover:text-red-800" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
          {quotations.length === 0 && (
            <EmptyTableRow colSpan={7} message={search ? 'No quotations match your search.' : 'No quotations found.'} />
          )}
        </TBody>
      </TableCard>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
