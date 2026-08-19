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
  FileText,
  Building2,
  RefreshCw,
  Eye,
} from 'lucide-react';

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

const STATUS_META: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted', color: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  quoted: { label: 'Quoted', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
};

const ALL_STATUSES = ['new', 'contacted', 'in_progress', 'quoted', 'closed'];

export default function PartsRequestsPage() {
  const [requests, setRequests] = useState<PartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (status) params.set('status', status);
      const response = await fetch(`/api/admin/parts-requests?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.requests);
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
    const timer = setTimeout(fetchRequests, 250);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

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
        setRequests((prev) => prev.filter((r) => r.id !== id));
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

  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    quoted: requests.filter((r) => r.status === 'quoted').length,
    closed: requests.filter((r) => r.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parts Requests</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer parts quote requests</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{message}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-sm text-gray-500">Total Requests</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
          <p className="text-sm text-gray-500">New</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-green-600">{stats.quoted}</div>
          <p className="text-sm text-gray-500">Quoted</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-3xl font-bold text-gray-600">{stats.closed}</div>
          <p className="text-sm text-gray-500">Closed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, email, phone..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No part requests found</h3>
          <p className="text-gray-500">Requests submitted from the parts page will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Items</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((request) => {
                  const statusMeta = STATUS_META[request.status] || STATUS_META.new;
                  const totalItems = request.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{request.name}</div>
                        {request.company && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                            <Building2 className="w-3 h-3" /> {request.company}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {request.phone}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {request.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{request.items.length} part(s), {totalItems} qty</div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {request.items.map((i) => i.partName).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/parts-requests/${request.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(request.id)}
                            disabled={deleting === request.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
