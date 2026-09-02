import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import ServiceItemForm from '@/components/admin/services/ServiceItemForm';
import { serverApiClient } from '@/lib/serverApiClient';

export const metadata: Metadata = {
  title: 'Edit Menu Item - Services Menu',
  description: 'Edit service menu item',
};

async function getItem(id: string) {
  try {
    const client = await serverApiClient();
    const { data } = await client.get(`/services-menu/items/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/services-menu"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Menu Item</h1>
          <p className="text-gray-600 mt-1">
            Update "{item.title}" details
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Changes will be visible immediately on the public website</li>
          <li>• Setting "Active" to OFF will hide this item from the menu</li>
          <li>• Deleting this item is permanent and cannot be undone</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ServiceItemForm item={item as any} mode="edit" />
      </div>
    </div>
  );
}
