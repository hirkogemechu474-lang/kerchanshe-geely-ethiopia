import { requirePermission } from '@/lib/auth/middleware';
import { Package, Warehouse, ArrowDownUp, AlertTriangle } from 'lucide-react';

const parts = [
  { sku: 'SP-001', name: 'Oil Filter', stock: 48, status: 'In Stock', supplier: 'Geely Parts East' },
  { sku: 'SP-002', name: 'Brake Pad Set', stock: 11, status: 'Low Stock', supplier: 'AutoCare Supply' },
  { sku: 'SP-003', name: 'Air Filter', stock: 67, status: 'In Stock', supplier: 'Geely Parts East' },
  { sku: 'SP-004', name: 'Spark Plug', stock: 0, status: 'Out of Stock', supplier: 'OEM Supply Co' },
];

export default async function SparePartsPage() {
  await requirePermission('canViewSpareParts');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Spare Parts Inventory</h1>
        <p className="mt-1 text-sm text-gray-500">Track parts stock, suppliers, and replenishment needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6"><Package className="w-8 h-8 text-blue-600 mb-3" /><div className="text-2xl font-bold">184</div><p className="text-sm text-gray-500">SKUs</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6"><Warehouse className="w-8 h-8 text-green-600 mb-3" /><div className="text-2xl font-bold">92%</div><p className="text-sm text-gray-500">Fill Rate</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6"><ArrowDownUp className="w-8 h-8 text-purple-600 mb-3" /><div className="text-2xl font-bold">17</div><p className="text-sm text-gray-500">Reorder Items</p></div>
        <div className="bg-white rounded-lg border border-gray-200 p-6"><AlertTriangle className="w-8 h-8 text-orange-600 mb-3" /><div className="text-2xl font-bold">4</div><p className="text-sm text-gray-500">Critical Alerts</p></div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">SKU</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Part</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Stock</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Supplier</th><th className="px-6 py-3 text-left text-xs uppercase text-gray-500">Status</th></tr></thead>
          <tbody className="divide-y">
            {parts.map((part) => (
              <tr key={part.sku} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{part.sku}</td>
                <td className="px-6 py-4">{part.name}</td>
                <td className="px-6 py-4">{part.stock}</td>
                <td className="px-6 py-4 text-gray-500">{part.supplier}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${part.status === 'In Stock' ? 'bg-green-100 text-green-700' : part.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{part.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
