'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Trash2, Phone, Mail, Calendar, Loader, Download, ShoppingCart } from 'lucide-react';

interface Quotation {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  vehicleModel: string | null;
  preferredDealer: string;
  financingInterest: boolean;
  tradeInInterest: boolean;
  message: string;
  status: string;
  source: string;
  createdAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  'walk-in': 'Walk-in',
  website: 'Website',
  referral: 'Referral',
  phone: 'Phone',
  other: 'Other',
};

export default function QuotationsList() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'approved' | 'converted' | 'closed'>('all');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch('/api/admin/quotations');
      const data = await response.json();
      setQuotations(data.quotations || []);
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const response = await fetch(`/api/admin/quotations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setQuotations(quotations.filter(q => q.id !== id));
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setQuotations(quotations.map(q => q.id === id ? { ...q, status: newStatus } : q));
      }
    } catch (error) {
      console.error('Error updating quotation:', error);
    }
  };

  const handleConvertToOrder = async (id: string) => {
    setConvertingId(id);
    try {
      const response = await fetch(`/api/admin/quotations/${id}/convert-to-order`, { method: 'POST' });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuotations = filter === 'all'
    ? quotations
    : quotations.filter(q => q.status === filter);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader className="animate-spin" /></div>;
  }

  const stats = {
    total: quotations.length,
    new: quotations.filter(q => q.status === 'new').length,
    contacted: quotations.filter(q => q.status === 'contacted').length,
    converted: quotations.filter(q => q.status === 'converted').length,
    approved: quotations.filter(q => q.status === 'approved').length,
    closed: quotations.filter(q => q.status === 'closed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-navy">{stats.total}</div>
          <p className="text-sm text-gray-600">Total Quotations</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.new}</div>
          <p className="text-sm text-gray-600">New</p>
        </div>
        <div className="bg-white rounded-lg border border-blue-200 p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.contacted}</div>
          <p className="text-sm text-gray-600">Contacted</p>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.converted}</div>
          <p className="text-sm text-gray-600">Converted</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-300 p-4 text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.closed}</div>
          <p className="text-sm text-gray-600">Closed</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'new'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          New ({stats.new})
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'contacted'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Contacted ({stats.contacted})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Approved ({stats.approved})
        </button>
        <button
          onClick={() => setFilter('converted')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'converted'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Converted ({stats.converted})
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            filter === 'closed'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Closed ({stats.closed})
        </button>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredQuotations.map((quotation) => (
              <tr key={quotation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{quotation.customerName}</p>
                  <p className="text-xs text-gray-500">{quotation.preferredDealer}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <a href={`tel:${quotation.phoneNumber}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                      <Phone size={14} />
                      {quotation.phoneNumber}
                    </a>
                    {quotation.email && (
                      <a href={`mailto:${quotation.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                        <Mail size={14} />
                        {quotation.email}
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{quotation.vehicleModel || 'General enquiry'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {SOURCE_LABELS[quotation.source] || quotation.source}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={quotation.status}
                    onChange={(e) => handleStatusChange(quotation.id, e.target.value)}
                    className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${getStatusColor(quotation.status)}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="in_progress">In Progress</option>
                    <option value="approved">Approved</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(quotation.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 items-center">
                    <Link
                      href={`/admin/quotations/${quotation.id}`}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <Eye size={16} />
                    </Link>
                    {(quotation.status === 'approved' || quotation.status === 'converted') && (
                      <button
                        onClick={() => handleConvertToOrder(quotation.id)}
                        disabled={convertingId === quotation.id}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                        title="Convert to order"
                      >
                        {convertingId === quotation.id ? <Loader size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(quotation.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredQuotations.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <p>No quotations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
