'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Package,
  Phone,
  Mail,
  Trash2,
  Loader2,
  Building2,
  RefreshCw,
  Eye,
  ListChecks,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader, Button, StatTile, Badge, TableCard, THead, TBody, Tr, Th, Td, EmptyState, Pagination, type Tone } from '@/components/admin/ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const PAGE_SIZE = 25;

interface RequestItem {
  id: string;
  partName: string;
  partSku: string | null;
  unitPrice: number;
  quantity: number;
}

interface PartRequest {
  id: string;
  name: string;
  company: string | null;
  phone: string;
  email: string;
  address: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  items: RequestItem[];
}

interface Stats {
  total: number;
  new: number;
  quoted: number;
  closed: number;
}

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'blue' },
  contacted: { label: 'Contacted', tone: 'purple' },
  in_progress: { label: 'In Progress', tone: 'orange' },
  quoted: { label: 'Quoted', tone: 'green' },
  closed: { label: 'Closed', tone: 'gray' },
};

const ALL_STATUSES = ['new', 'contacted', 'in_progress', 'quoted', 'closed'];

export default function PartsRequestsPage() {
  useAdminAuth('canManageSpareParts');
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, new: 0, quoted: 0, closed: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRequests = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (search) params.set('q', search);
      if (status) params.set('status', status);
      const response = await fetch(`/api/admin/parts-requests?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
        setStats(data.stats);
        setTotal(data.total);
      } else {
        setError(data.error || 'Failed to load requests');
      }
    } catch (err) {
      setError('Failed to load part requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRequests(page), search ? 250 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRequests, page]);

  // Any change to search/status invalidates the current page — jump back to 1.
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this part request? This cannot be undone.')) return;
    setDeleting(id);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/parts-requests/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMessage('Part request deleted successfully.');
        fetchRequests(page);
      } else {
        setError(data.error || 'Failed to delete request');
      }
    } catch (err) {
      setError('Failed to delete request');
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parts Requests"
        description="Manage customer parts quote requests"
        actions={
          <Button variant="secondary" onClick={() => fetchRequests(page)}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        }
      />

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Requests" value={stats.total} icon={Package} />
        <StatTile label="New" value={stats.new} icon={Inbox} tone={stats.new > 0 ? 'highlight' : 'default'} />
        <StatTile label="Quoted" value={stats.quoted} icon={ListChecks} />
        <StatTile label="Closed" value={stats.closed} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, phone…"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-geely-blue" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState icon={Package} title="No part requests found" description="Requests submitted from the parts page will appear here." />
      ) : (
        <>
          <TableCard>
            <THead>
              <tr>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {requests.map((request) => {
                const statusMeta = STATUS_META[request.status] || STATUS_META.new;
                const totalItems = request.items.reduce((sum, i) => sum + i.quantity, 0);
                return (
                  <Tr key={request.id}>
                    <Td>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{request.name}</div>
                      {request.company && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <Building2 className="w-3 h-3" /> {request.company}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {request.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {request.email}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{request.items.length} part(s), {totalItems} qty</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 max-w-xs">
                        {request.items.map((i) => i.partName).join(', ')}
                      </div>
                    </Td>
                    <Td><Badge tone={statusMeta.tone}>{statusMeta.label}</Badge></Td>
                    <Td className="text-gray-500 dark:text-gray-400">{new Date(request.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/parts-requests/${request.id}`} className="text-geely-blue dark:text-blue-400 hover:underline" title="View details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(request.id)}
                          disabled={deleting === request.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </TableCard>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
