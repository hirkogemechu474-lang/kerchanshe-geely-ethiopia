'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, Loader2, Search } from 'lucide-react';

interface Part {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string | null;
  isFeatured: boolean;
  displayOrder: number;
  isActive: boolean;
  partCategory: { name: string } | null;
}

export default function FeaturedPartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchParts = async () => {
    try {
      const response = await fetch('/api/parts?pageSize=1000');
      const data = await response.json();
      if (data.items) setParts(data.items);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParts(); }, []);

  const toggleFeature = async (part: Part) => {
    setTogglingId(part.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/parts/${part.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !part.isFeatured }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: part.isFeatured ? `Removed "${part.name}" from featured` : `Featured "${part.name}"` });
        fetchParts();
      } else {
        setMessage({ type: 'error', text: 'Failed to update part' });
      }
    } catch (error) {
      console.error('Error updating part:', error);
      setMessage({ type: 'error', text: 'Failed to update part' });
    } finally {
      setTogglingId(null);
    }
  };

  const updateOrder = async (id: string, displayOrder: number) => {
    setMessage(null);
    try {
      const response = await fetch(`/api/parts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayOrder }),
      });
      if (response.ok) fetchParts();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const filteredParts = parts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredParts = parts.filter((p) => p.isFeatured);
  const nonFeaturedParts = filteredParts.filter((p) => !p.isFeatured);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/parts" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Featured Parts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Select which parts appear in the highlighted section on the /parts page
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Featured Parts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b bg-blue-50">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-geely-blue fill-current" />
            <h2 className="font-semibold text-gray-900">Currently Featured ({featuredParts.length})</h2>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {featuredParts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No featured parts yet. Toggle a part below to feature it on the page.
                </td>
              </tr>
            ) : (
              featuredParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{part.name}</div>
                    <div className="text-xs text-gray-500">{part.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{part.partCategory?.name || part.category}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={part.displayOrder}
                      onChange={(e) => updateOrder(part.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-geely-blue"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {togglingId === part.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline" />
                    ) : (
                      <button onClick={() => toggleFeature(part)} className="text-red-600 hover:text-red-700 font-medium text-sm">
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Available Parts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Available Parts</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parts..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-geely-blue"
            />
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {nonFeaturedParts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No parts found.</td>
              </tr>
            ) : (
              nonFeaturedParts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{part.name}</div>
                    <div className="text-xs text-gray-500">{part.sku}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{part.partCategory?.name || part.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${part.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {part.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {togglingId === part.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline" />
                    ) : (
                      <button
                        onClick={() => toggleFeature(part)}
                        disabled={!part.isActive}
                        className="inline-flex items-center gap-1 text-geely-blue hover:text-navy font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Star className="w-4 h-4" /> Feature
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}