import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricSectionForm from '@/components/admin/electric/ElectricSectionForm';
import { PageHeader, Card } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'New Section - Electric Menu',
  description: 'Create a new electric menu section',
};

export default function NewElectricSectionPage() {
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
          <PageHeader title="Create Electric Section" description="Add a new section to your electric menu" />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">⚡ Electric Section Tips</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Create logical groupings like "Models", "Charging", "Benefits"</li>
          <li>• Use clear, descriptive titles for better user experience</li>
          <li>• Set display order to control section sequence (0 = first)</li>
          <li>• Toggle "Active" to show/hide sections from the public menu</li>
          <li>• Add Lucide icon names for visual appeal (Car, Zap, Award, etc.)</li>
        </ul>
      </div>

      {/* Form */}
      <Card>
        <ElectricSectionForm mode="create" />
      </Card>
    </div>
  );
}