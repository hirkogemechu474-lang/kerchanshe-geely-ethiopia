import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { notFound } from 'next/navigation';
import ServicePageForm from '@/components/admin/services/ServicePageForm';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Edit Service Page - Services Menu',
  description: 'Edit service page',
};

async function getPage(id: string) {
  try {
    return await prisma.servicePage.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/services-menu/pages"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Service Page</h1>
            <p className="text-gray-600 mt-1">
              Update "{page.title}"
            </p>
          </div>
        </div>
        {page.isPublished && (
          <a
            href={`/services/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Live Page
          </a>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Changes will be visible immediately after saving (if published)</li>
          <li>• Unpublishing will hide the page from the public website</li>
          <li>• Changing the slug will change the page URL</li>
          <li>• Deleting this page is permanent and cannot be undone</li>
          <li>• Menu items linking to this page will need to be updated if you change the slug</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ServicePageForm page={page} mode="edit" />
      </div>
    </div>
  );
}
