'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Edit, Trash2, Eye, Copy } from 'lucide-react';

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

  function getStockStatus(stock: number) {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700' };
    if (stock <= 5) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-700' };
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
    <>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles by name, model, or SKU..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
              <p className="text-gray-600">Loading vehicles...</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No vehicles found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model / SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vehicles.map((vehicle) => {
                    const stockStatus = getStockStatus(vehicle.stock);
                    const displayPrice = vehicle.finalPrice || vehicle.basePrice;
                    const imageUrl = vehicle.heroImageUrl || 
                                    (Array.isArray(vehicle.images) && vehicle.images[0]) || 
                                    null;

                    return (
                      <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vehicle.model}</div>
                          {vehicle.sku && (
                            <div className="text-xs text-gray-500">{vehicle.sku}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {vehicle.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>{formatPrice(displayPrice)}</div>
                          {vehicle.hidePrice && (
                            <div className="text-xs font-normal text-amber-600">Hidden on website</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vehicle.stock} units
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/vehicles/${vehicle.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">{startIndex}</span> to{' '}
                <span className="font-medium">{endIndex}</span> of{' '}
                <span className="font-medium">{total}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="px-2">...</span>}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
