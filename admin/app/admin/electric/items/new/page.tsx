import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricItemForm from '@/components/admin/electric/ElectricItemForm';
import { PageHeader, Card } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'New Item - Electric Menu',
  description: 'Create a new electric menu item',
};

export default function NewElectricItemPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/electric"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <PageHeader title="Create Electric Menu Item" description="Add a new item to your electric menu" />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">⚡ Electric Item Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Items appear under sections in the electric menu</li>
          <li>• Use clear, action-oriented titles (e.g., "View Models", "Find Charging")</li>
          <li>• Link to internal pages or external URLs</li>
          <li>• Mark important items as "Featured" to highlight them</li>
          <li>• Set display order to control item sequence within sections</li>
        </ul>
      </div>

      {/* Form */}
      <Card>
        <ElectricItemForm mode="create" />
      </Card>
    </div>
  );
}