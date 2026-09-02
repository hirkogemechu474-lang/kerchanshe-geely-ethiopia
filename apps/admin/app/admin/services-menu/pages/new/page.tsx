import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ServicePageForm from '@/components/admin/services/ServicePageForm';
import { PageHeader, Card } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'New Service Page - Services Menu',
  description: 'Create a new service page',
};

export default function NewPagePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/services-menu/pages"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Create Service Page"
          description="Create a new page with detailed service information"
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Page Creation Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Enter a clear, descriptive title (auto-generates the URL slug)</li>
          <li>• Write a brief excerpt (used in previews and search results)</li>
          <li>• Add your main content (HTML and markdown are supported)</li>
          <li>• Upload a hero image or video for visual impact</li>
          <li>• Fill in SEO meta title and description for better search visibility</li>
          <li>• Toggle "Published" ON when ready to make it public</li>
        </ul>
      </div>

      {/* Form */}
      <Card>
        <ServicePageForm mode="create" />
      </Card>
    </div>
  );
}
