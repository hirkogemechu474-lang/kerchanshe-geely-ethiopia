'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye, Copy } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  model: string;
  category: string;
  basePrice: number;
  finalPrice: number | null;
  stock: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  year: number;
  heroImageUrl: string | null;
  images: any;
}

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const response = await fetch('/api/admin/vehicles?limit=20&page=1');
      if (!response.ok) return;

      const data = await response.json();
      setVehicles(data.vehicles || data || []);
      setTotal(data.pagination?.total ?? (data.vehicles || data || []).length);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (stock: number) => {
    if (stock === 0) {
      return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Out of Stock</span>;
    }

    if (stock <= 5) {
      return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">Low Stock</span>;
    }

    return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">In Stock</span>;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-600">
                  Loading vehicles...
                </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-600">
                  No vehicles found
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => {
                const imageUrl =
                  vehicle.heroImageUrl ||
                  (Array.isArray(vehicle.images) && vehicle.images[0]) ||
                  null;
                const displayPrice = vehicle.finalPrice ?? vehicle.basePrice;
                return (
                  <tr key={vehicle.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {imageUrl ? (
                            <img src={imageUrl} alt={vehicle.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{vehicle.model}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{vehicle.category}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(displayPrice)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {vehicle.stock} units
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">{getStatusBadge(vehicle.stock)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/vehicles/${vehicle.id}`}
                          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/vehicles/${vehicle.id}/edit`}
                          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">1</span> to <span className="font-medium">{vehicles.length}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg border border-gray-300 px-3 py-1 transition-colors hover:bg-gray-50">
            Previous
          </button>
          <button className="rounded-lg bg-blue-600 px-3 py-1 text-white">1</button>
          <button className="rounded-lg border border-gray-300 px-3 py-1 transition-colors hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
