import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricPageForm from '@/components/admin/electric/ElectricPageForm';
import { PageHeader, Card } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'New Page - Electric Menu',
  description: 'Create a new electric content page',
};

export default function NewElectricPagePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/electric/pages"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <PageHeader title="Create Electric Page" description="Add a new content page for your electric menu" />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">⚡ Page Creation Tips</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Write engaging titles that clearly describe the content</li>
          <li>• Use HTML for rich formatting (headings, lists, links, etc.)</li>
          <li>• Fill out SEO settings for better search engine visibility</li>
          <li>• Start as "Draft" to preview before publishing</li>
          <li>• Link menu items to this page after creation</li>
        </ul>
      </div>

      {/* Form */}
      <Card>
        <ElectricPageForm mode="create" />
      </Card>
    </div>
  );
}