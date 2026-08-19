import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Service Pages - Services Menu',
  description: 'Manage service pages',
};

async function getPages() {
  try {
    return await prisma.servicePage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

export default async function ServicePagesPage() {
  const pages = await getPages();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Pages</h1>
          <p className="text-gray-600 mt-1">
            Manage content pages for your services
          </p>
        </div>
        <Link
          href="/admin/services-menu/pages/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Page
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📄 About Service Pages</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Service pages contain detailed information about your services</li>
          <li>• Each page has a unique URL like /services/test-drive</li>
          <li>• Only published pages are visible to the public</li>
          <li>• Link menu items to pages for seamless navigation</li>
        </ul>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{pages.length}</div>
          <div className="text-sm text-gray-600">Total Pages</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {pages.filter((p: any) => p.isPublished).length}
          </div>
          <div className="text-sm text-gray-600">Published</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-400">
            {pages.filter((p: any) => !p.isPublished).length}
          </div>
          <div className="text-sm text-gray-600">Drafts</div>
        </div>
      </div>

      {/* Pages List */}
      {pages.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pages yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first service page to get started
          </p>
          <Link
            href="/admin/services-menu/pages/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create First Page
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug (URL)
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pages.map((page: any) => (
                <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{page.title}</div>
                    {page.excerpt && (
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {page.excerpt}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        /services/{page.slug}
                      </code>
                      {page.isPublished && (
                        <a
                          href={`/services/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {page.isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Eye className="w-3 h-3" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <EyeOff className="w-3 h-3" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(page.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/services-menu/pages/${page.id}/edit`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit page"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Back Link */}
      <div className="flex justify-center">
        <Link
          href="/admin/services-menu"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Back to Services Menu
        </Link>
      </div>
    </div>
  );
}
