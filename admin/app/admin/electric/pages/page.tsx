import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Eye, EyeOff, FileText } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Electric Pages - Admin',
  description: 'Manage electric content pages',
};

async function getPages() {
  try {
    return await prisma.electricMenuPage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export default async function ElectricPagesPage() {
  const pages = await getPages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/electric"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Electric Pages</h1>
            <p className="text-gray-600 mt-1">
              Manage content pages for your electric menu items
            </p>
          </div>
        </div>
        <Link
          href="/admin/electric/pages/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Page
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📄 About Electric Pages</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pages contain detailed content for electric menu items</li>
          <li>• Link menu items to pages for rich content experiences</li>
          <li>• Pages must be "Published" to be visible to visitors</li>
          <li>• Draft pages are only visible in admin preview</li>
          <li>• SEO settings help with search engine visibility</li>
        </ul>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No electric pages yet</h3>
            <p className="text-gray-600 mb-6">
              Create content pages for your electric menu items
            </p>
            <Link
              href="/admin/electric/pages/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-5 h-5" />
              Create First Page
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pages.map((page: any) => (
              <div key={page.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {page.title}
                      </h3>
                      {page.isPublished ? (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">
                      URL: <span className="font-mono text-sm text-blue-600">/electric/{page.slug}</span>
                    </p>
                    {page.metaDescription && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {page.metaDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Created: {new Date(page.createdAt).toLocaleDateString()}</span>
                      <span>Updated: {new Date(page.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {page.isPublished && (
                      <Link
                        href={`/electric/${page.slug}`}
                        target="_blank"
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="View live page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/electric/pages/${page.id}/edit`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit page"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}