'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Search, Loader2, Eye, EyeOff, Pencil, Trash2, Star } from 'lucide-react';

interface Dealer {
  id: string;
  name: string;
  type: string;
  city: string;
  region: string;
  country: string;
  contact: any;
  logo: string | null;
  active: boolean;
  featured: boolean;
  rating: number;
  salesCount: number;
  staffCount: number;
}

export default function DealersPage() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDealers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (cityFilter !== 'all') params.set('city', cityFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const response = await fetch(`/api/admin/dealers?${params.toString()}`);
      const data = await response.json();
      if (data.success) setDealers(data.dealers);
    } catch (error) {
      console.error('Error fetching dealers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, cityFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchDealers, 300);
    return () => clearTimeout(t);
  }, [fetchDealers]);

  const togglePublish = async (dealer: Dealer) => {
    try {
      const response = await fetch(`/api/admin/dealers/${dealer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !dealer.active }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: dealer.active ? `"${dealer.name}" unpublished` : `"${dealer.name}" published` });
        fetchDealers();
      }
    } catch (error) {
      console.error('Error toggling dealer:', error);
    }
  };

  const handleDelete = async (dealer: Dealer) => {
    if (!confirm(`Delete "${dealer.name}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/dealers/${dealer.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `"${dealer.name}" deleted` });
        fetchDealers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete dealer' });
      }
    } catch (error) {
      console.error('Error deleting dealer:', error);
    }
  };

  const cities = Array.from(new Set(dealers.map((d) => d.city))).sort();
  const stats = {
    total: dealers.length,
    active: dealers.filter((d) => d.active).length,
    featured: dealers.filter((d) => d.featured).length,
    cities: cities.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dealer Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage dealerships, locations, and publishing</p>
        </div>
        <Link href="/admin/dealers/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-5 h-5" /> Add Dealer
        </Link>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MapPin className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-sm text-gray-500">Total Dealers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Eye className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
          <p className="text-sm text-gray-500">Published</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Star className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.featured}</div>
          <p className="text-sm text-gray-500">Featured</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MapPin className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{stats.cities}</div>
          <p className="text-sm text-gray-500">Cities</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or region..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="all">All Types</option>
            <option value="showroom">Showroom</option>
            <option value="service">Service</option>
            <option value="both">Showroom & Service</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dealer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City / Region</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {dealers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No dealers found. Add your first dealer to get started.
                  </td>
                </tr>
              ) : (
                dealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {dealer.logo ? (
                          <img src={dealer.logo} alt={dealer.name} className="w-10 h-10 object-contain rounded-lg" />
                        ) : (
                          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{dealer.name}</div>
                          <div className="text-sm text-gray-500">{dealer.contact?.phone || dealer.contact?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{dealer.city}{dealer.region && dealer.region !== dealer.city ? `, ${dealer.region}` : ''}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        dealer.type === 'both' ? 'bg-green-100 text-green-700' : dealer.type === 'showroom' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {dealer.type === 'both' ? 'Showroom & Service' : dealer.type === 'showroom' ? 'Showroom' : 'Service'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${dealer.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {dealer.active ? 'Published' : 'Unpublished'}
                        </span>
                        {dealer.featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => togglePublish(dealer)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title={dealer.active ? 'Unpublish' : 'Publish'}
                        >
                          {dealer.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link href={`/admin/dealers/${dealer.id}`} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="View Details">
                          <MapPin className="w-4 h-4" />
                        </Link>
                        <Link href={`/admin/dealers/${dealer.id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(dealer)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}