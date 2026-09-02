'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Download, Edit, Trash2, Eye } from 'lucide-react';
import { Card, Button, Badge, TableCard, THead, TBody, Tr, Th, Td, EmptyState } from '@/components/admin/ui';

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  category: string;
  basePrice: number;
  finalPrice: number | null;
  hidePrice: boolean;
  stock: number;
  status: string;
  heroImageUrl: string | null;
  images: any;
  sku: string | null;
}

interface Props {
  initialVehicles: Vehicle[];
  totalCount: number;
}

export default function VehicleManagementClient({ initialVehicles, totalCount }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(totalCount);
  const pageSize = 20;

  // Fetch vehicles with filters
  async function fetchVehicles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/admin/vehicles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || data);
        if (data.total) setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '' || categoryFilter !== 'all' || statusFilter !== 'all') {
        fetchVehicles();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, statusFilter, currentPage]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Vehicle deleted successfully!');
        fetchVehicles();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle');
    }
  }

  function getStockStatus(stock: number): { label: string; tone: 'red' | 'orange' | 'green' } {
    if (stock === 0) return { label: 'Out of Stock', tone: 'red' };
    if (stock <= 5) return { label: 'Low Stock', tone: 'orange' };
    return { label: 'In Stock', tone: 'green' };
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles by name, model, or SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </div>
          <Button variant="secondary">
            <Download className="w-5 h-5" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue"
            >
              <option value="all">All Categories</option>
              <option value="SUV">SUV</option>
              <option value="Sedan">Sedan</option>
              <option value="Electric">Electric</option>
              <option value="Hatchback">Hatchback</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Vehicle List */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-geely-blue border-t-transparent mb-4"></div>
              <p className="text-gray-600">Loading vehicles...</p>
            </div>
          </div>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card padding="none">
          <EmptyState title="No vehicles found" />
        </Card>
      ) : (
        <>
          <TableCard>
            <THead>
              <tr>
                <Th>Vehicle</Th>
                <Th>Model / SKU</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </THead>
            <TBody>
              {vehicles.map((vehicle) => {
                const stockStatus = getStockStatus(vehicle.stock);
                const displayPrice = vehicle.finalPrice || vehicle.basePrice;
                const imageUrl = vehicle.heroImageUrl ||
                                (Array.isArray(vehicle.images) && vehicle.images[0]) ||
                                null;

                return (
                  <Tr key={vehicle.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={vehicle.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              IMG
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{vehicle.name}</div>
                          <div className="text-sm text-gray-500">{vehicle.year}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="text-gray-900">{vehicle.model}</div>
                      {vehicle.sku && (
                        <div className="text-xs text-gray-500">{vehicle.sku}</div>
                      )}
                    </Td>
                    <Td className="text-gray-500">{vehicle.category}</Td>
                    <Td className="font-medium text-gray-900">
                      <div>{formatPrice(displayPrice)}</div>
                      {vehicle.hidePrice && (
                        <div className="text-xs font-normal text-amber-600">Hidden on website</div>
                      )}
                    </Td>
                    <Td>{vehicle.stock} units</Td>
                    <Td>
                      <Badge tone={stockStatus.tone}>{stockStatus.label}</Badge>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/vehicles/${vehicle.id}`}
                          className="p-2 text-geely-blue hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/edit`}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(vehicle.id, vehicle.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </TableCard>

          {/* Pagination */}
          <Card className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{startIndex}</span> to{' '}
              <span className="font-medium">{endIndex}</span> of{' '}
              <span className="font-medium">{total}</span> results
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
              {totalPages > 5 && <span className="px-2 self-center">...</span>}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
