'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Download, Edit, Trash2, Eye } from 'lucide-react';
import { Card, Button, Badge, TableCard, THead, TBody, Tr, Th, Td, EmptyState } from '@/components/admin/ui';
import { revalidateHomepage } from '@/lib/revalidateHomepage';
import { downloadReportCsv, tableSection } from '@/lib/reportExport';

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

interface Category {
  id: string;
  name: string;
}

interface Props {
  initialVehicles: Vehicle[];
  totalCount: number;
}

/**
 * Vehicle thumbnail with a shared fallback: shows the "IMG" placeholder both
 * when there's no image URL at all, and when the given URL fails to load
 * (broken/expired link) — tracked via local state so each instance recovers
 * independently.
 */
function VehicleThumb({ src, alt, sizeClass }: { src: string | null; alt: string; sizeClass: string }) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;

  return (
    <div className={`${sizeClass} rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden`}>
      {showFallback ? (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
          IMG
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

export default function VehicleManagementClient({ initialVehicles, totalCount }: Props) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(totalCount);
  const pageSize = 20;
  const isFirstRender = useRef(true);

  // Real categories for the filter dropdown (was a hardcoded SUV/Sedan/
  // Electric/Hatchback list that didn't match any actual VehicleCategory).
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => (r.ok ? r.json() : { categories: [] }))
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Fetch vehicles with filters
  async function fetchVehicles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) params.append('search', searchQuery);
      // Backend filters on categoryId (a real VehicleCategory id), not a
      // free-text category name — was previously sent as "category" with a
      // hardcoded name value, which the backend silently ignored.
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/vehicles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.items || []);
        setTotal(data.total ?? 0);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  // Debounced search/filter/page changes. Skips the very first render since
  // initialVehicles/totalCount already cover that (server-rendered) — every
  // change after that (including just paging, previously ignored here)
  // re-fetches.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, categoryFilter, statusFilter, currentPage]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone — its colors, interiors and packages will be deleted too.`)) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Vehicle permanently deleted.');
        fetchVehicles();
        await revalidateHomepage();
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

  // Vehicle.status (draft/published/archived) used to be write-only —
  // VehicleForm hardcoded every save to 'published', so this was never
  // worth surfacing. Now that it's a real control (SEO & Publish step),
  // show it explicitly rather than relying on the stock-status badge, which
  // answers a different question entirely.
  function getVisibility(status: string): { label: string; tone: 'gray' | 'green' | 'orange' } {
    if (status === 'published') return { label: 'Published', tone: 'green' };
    if (status === 'archived') return { label: 'Archived', tone: 'gray' };
    return { label: 'Draft', tone: 'orange' };
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleExport = () => {
    downloadReportCsv({
      title: 'Vehicles',
      subtitle: `${vehicles.length} of ${total} vehicle${total === 1 ? '' : 's'} — current page/filter`,
      sections: [
        tableSection(
          'Vehicles',
          ['Name', 'Model', 'Year', 'Category', 'SKU', 'Base Price', 'Final Price', 'Stock', 'Status'],
          vehicles.map((v) => [
            v.name,
            v.model,
            v.year,
            v.category,
            v.sku ?? '',
            formatPrice(v.basePrice),
            v.finalPrice != null ? formatPrice(v.finalPrice) : '',
            v.stock,
            getVisibility(v.status).label,
          ])
        ),
      ],
    });
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
          <Button variant="secondary" onClick={handleExport} disabled={vehicles.length === 0}>
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
          {/* Desktop / tablet: full table — unchanged at md+ widths */}
          <div className="hidden md:block">
            <TableCard>
              <THead>
                <tr>
                  <Th>Vehicle</Th>
                  <Th>Model / SKU</Th>
                  <Th>Category</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Visibility</Th>
                  <Th>Stock Status</Th>
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
                          <VehicleThumb src={imageUrl} alt={vehicle.name} sizeClass="w-12 h-12" />
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
                        <Badge tone={getVisibility(vehicle.status).tone}>{getVisibility(vehicle.status).label}</Badge>
                      </Td>
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
          </div>

          {/* Phone: vertical stack of cards, one per vehicle */}
          <div className="md:hidden space-y-3">
            {vehicles.map((vehicle) => {
              const stockStatus = getStockStatus(vehicle.stock);
              const displayPrice = vehicle.finalPrice || vehicle.basePrice;
              const imageUrl = vehicle.heroImageUrl ||
                              (Array.isArray(vehicle.images) && vehicle.images[0]) ||
                              null;

              return (
                <Card key={vehicle.id} padding="sm">
                  <div className="flex items-center gap-3">
                    <VehicleThumb src={imageUrl} alt={vehicle.name} sizeClass="w-16 h-16" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{vehicle.name}</div>
                      <div className="text-sm text-gray-500">{vehicle.year}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Model / SKU</div>
                      <div className="text-gray-900">{vehicle.model}</div>
                      {vehicle.sku && <div className="text-xs text-gray-500">{vehicle.sku}</div>}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Category</div>
                      <div className="text-gray-500">{vehicle.category}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Price</div>
                      <div className="font-medium text-gray-900">{formatPrice(displayPrice)}</div>
                      {vehicle.hidePrice && (
                        <div className="text-xs font-normal text-amber-600">Hidden on website</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Stock</div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-gray-700">{vehicle.stock} units</span>
                        <Badge tone={stockStatus.tone}>{stockStatus.label}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wide text-gray-400">Visibility</div>
                      <Badge tone={getVisibility(vehicle.status).tone}>{getVisibility(vehicle.status).label}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-gray-100 pt-3">
                    <Link
                      href={`/admin/vehicles/${vehicle.id}`}
                      className="p-3 text-geely-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/admin/vehicles/${vehicle.id}/edit`}
                      className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle.id, vehicle.name)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

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
