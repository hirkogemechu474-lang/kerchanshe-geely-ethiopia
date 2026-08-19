import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricPageForm from '@/components/admin/electric/ElectricPageForm';

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Electric Page</h1>
          <p className="text-gray-600 mt-1">
            Add a new content page for your electric menu
          </p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ElectricPageForm mode="create" />
      </div>
    </div>
  );
}