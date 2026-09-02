import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { serverApiClient } from '@/lib/serverApiClient';



export default async function PartsPage() {
  await requirePermission('canManageSpareParts');

  // Fetch spare parts from the backend
  const client = await serverApiClient();
  const { data } = await client.get('/parts', { params: { pageSize: 1000 } });
  const parts = data.items;

  // Calculate statistics
  const totalParts = parts.length;
  const lowStockParts = parts.filter(p => p.stock < p.reorderPoint).length;
  const totalInventoryValue = parts.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Spare Parts Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage parts catalog and stock levels</p>
        </div>
        <Link
          href="/admin/parts/new"
          className="flex items-center gap-2 bg-geely-blue text-white px-4 py-2 rounded-lg hover:bg-navy transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Part
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Package className="w-8 h-8 text-geely-blue mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{totalParts}</h3>
          <p className="text-sm text-gray-500">Total Parts</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <AlertTriangle className="w-8 h-8 text-red-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{lowStockParts}</h3>
          <p className="text-sm text-gray-500">Low Stock</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <TrendingUp className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{parts.filter(p => p.isActive).length}</h3>
          <p className="text-sm text-gray-500">Active Parts</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <DollarSign className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">
            ETB {(totalInventoryValue / 1000000).toFixed(1)}M
          </h3>
          <p className="text-sm text-gray-500">Inventory Value</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {parts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No spare parts in inventory</p>
                  <Link href="/admin/parts/new" className="text-geely-blue hover:underline mt-2 inline-block">
                    Add your first part
                  </Link>
                </td>
              </tr>
            ) : (
              parts.map((part) => (
                <tr key={part.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{part.name}</td>
                  <td className="px-6 py-4 text-gray-500">{part.sku}</td>
                  <td className="px-6 py-4 text-gray-900 capitalize">{part.category}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${
                      part.stock < part.reorderPoint ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {part.stock}
                    </span>
                    {part.stock < part.reorderPoint && (
                      <span className="ml-2 text-xs text-red-600">Low</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-900">ETB {part.price.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{part.supplier}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/parts/${part.id}`} className="text-geely-blue hover:text-navy">
                      Edit
                    </Link>
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
