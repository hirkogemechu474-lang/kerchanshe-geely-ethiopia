'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  FileText,
  Package,
  Save,
  User,
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
  updatedAt: string;
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

const formatPrice = (price: number) => `ETB ${price.toLocaleString()}`;

export default function PartRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<PartRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const response = await fetch(`/api/admin/parts-requests/${id}`);
        const data = await response.json();
        if (data.success) {
          setRequest(data.request);
          setStatus(data.request.status);
        } else {
          setError(data.error || 'Request not found');
        }
      } catch (err) {
        setError('Failed to load request');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/admin/parts-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        setRequest(data.request);
        setStatus(data.request.status);
        setMessage('Status updated successfully.');
      } else {
        setError(data.error || 'Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this part request? This cannot be undone.')) return;
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/parts-requests/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        router.push('/admin/parts-requests');
        router.refresh();
      } else {
        setError(data.error || 'Failed to delete request');
      }
    } catch (err) {
      setError('Failed to delete request');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Part request not found</h3>
        <p className="text-gray-500 mb-6">This request may have been deleted.</p>
        <Link
          href="/admin/parts-requests"
          className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Back to Part Requests
        </Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[status] || STATUS_META.new;
  const subtotal = request.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/parts-requests" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Part Request Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              Submitted on {new Date(request.createdAt).toLocaleString()} · ID: {request.id.slice(0, 8)}...
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete Request
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{message}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{request.name}</div>
                  {request.company && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <Building2 className="w-3 h-3" /> {request.company}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                <a href={`tel:${request.phone}`} className="text-sm text-gray-700 hover:text-blue-600">{request.phone}</a>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <a href={`mailto:${request.email}`} className="text-sm text-gray-700 hover:text-blue-600 break-all">{request.email}</a>
              </div>
              {request.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <span className="text-sm text-gray-700">{request.address}</span>
                </div>
              )}
            </div>
            {request.notes && (
              <div className="mt-4 bg-ice rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                  <FileText className="w-4 h-4" /> Customer Notes
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{request.notes}</p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">Requested Parts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Part</th>
                    <th className="px-6 py-3">Part #</th>
                    <th className="px-6 py-3">Unit Price</th>
                    <th className="px-6 py-3">Qty</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {request.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.partName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.partSku || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatPrice(item.unitPrice)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-right font-semibold text-gray-900">Estimated Total</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{formatPrice(subtotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Status Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusUpdate}
                disabled={saving || status === request.status}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Status'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted</span>
                <span className="text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="text-gray-900">{new Date(request.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
