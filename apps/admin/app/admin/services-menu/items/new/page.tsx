import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ServiceItemForm from '@/components/admin/services/ServiceItemForm';

export const metadata: Metadata = {
  title: 'New Menu Item - Services Menu',
  description: 'Create a new service menu item',
};

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/services-menu/pages"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Menu Item</h1>
          <p className="text-gray-600 mt-1">
            Add a new item to your services menu
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Menu Item Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Choose which section this item belongs to (Sales, Service & Parts, etc.)</li>
          <li>• Add a clear title and short description</li>
          <li>• Optional: Add an icon name (Car, Wrench, Shield) and image URL</li>
          <li>• Set display order (0 = first, 1 = second, etc.)</li>
          <li>• Toggle "Active" to show/hide in the menu</li>
          <li>• Toggle "Featured" to highlight important items</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ServiceItemForm mode="create" />
      </div>
    </div>
  );
}
