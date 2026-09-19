'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Search, Loader2, Eye, EyeOff, Pencil, Trash2, Star } from 'lucide-react';
import { PageHeader, LinkButton, Card, StatTile, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyTableRow } from '@/components/admin/ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';

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
  useAdminAuth('canViewDealers');
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
      const response = await fetch(`/api/dealers?${params.toString()}`);
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
      const response = await fetch(`/api/dealers/${dealer.id}`, {
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
      const response = await fetch(`/api/dealers/${dealer.id}`, { method: 'DELETE' });
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
      <PageHeader
        title="Dealer Management"
        description="Manage dealerships, locations, and publishing"
        actions={
          <LinkButton href="/admin/dealers/new">
            <Plus className="w-4 h-4" /> Add Dealer
          </LinkButton>
        }
      />

      {message && (
        <div className={`px-4 py-3 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatTile label="Total Dealers" value={stats.total} icon={MapPin} />
        <StatTile label="Published" value={stats.active} icon={Eye} />
        <StatTile label="Featured" value={stats.featured} icon={Star} />
        <StatTile label="Cities" value={stats.cities} icon={MapPin} />
      </div>

      {/* Search & Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city, or region..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-geely-blue"
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
      </Card>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
        </div>
      ) : (
        <TableCard>
          <THead>
            <tr>
              <Th>Dealer</Th>
              <Th>City / Region</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </THead>
          <TBody>
            {dealers.length === 0 ? (
              <EmptyTableRow colSpan={5} message="No dealers found. Add your first dealer to get started." />
            ) : (
              dealers.map((dealer) => (
                <Tr key={dealer.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {dealer.logo ? (
                        <img src={dealer.logo} alt={dealer.name} className="w-10 h-10 object-contain rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-geely-blue" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{dealer.name}</div>
                        <div className="text-sm text-gray-500">{dealer.contact?.phone || dealer.contact?.email || ''}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-gray-500">{dealer.city}{dealer.region && dealer.region !== dealer.city ? `, ${dealer.region}` : ''}</Td>
                  <Td>
                    <Badge tone={dealer.type === 'both' ? 'green' : dealer.type === 'showroom' ? 'blue' : 'orange'}>
                      {dealer.type === 'both' ? 'Showroom & Service' : dealer.type === 'showroom' ? 'Showroom' : 'Service'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Badge tone={dealer.active ? 'green' : 'gray'}>{dealer.active ? 'Published' : 'Unpublished'}</Badge>
                      {dealer.featured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </div>
                  </Td>
                  <Td className="text-right">
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
                      <Link href={`/admin/dealers/${dealer.id}/edit`} className="p-2 text-geely-blue hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(dealer)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </TableCard>
      )}
    </div>
  );
}
