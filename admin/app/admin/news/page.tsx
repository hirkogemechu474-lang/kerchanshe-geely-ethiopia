import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, FileText, Eye, Calendar, Edit } from 'lucide-react';
import { prisma } from '@/lib/prisma';



export default async function NewsPage() {
  await requirePermission('canManageContent');

  // Fetch articles from database
  const articles = await prisma.newsArticle.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Calculate statistics
  const totalArticles = articles.length;
  const scheduledArticles = articles.filter(a => a.status === 'scheduled').length;
  const draftArticles = articles.filter(a => a.status === 'draft').length;
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">News & Content</h1>
          <p className="mt-1 text-sm text-gray-500">Manage news articles and blog posts</p>
        </div>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Article
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{totalArticles}</h3>
          <p className="text-sm text-gray-500">Total Articles</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Calendar className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{scheduledArticles}</h3>
          <p className="text-sm text-gray-500">Scheduled</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Edit className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">{draftArticles}</h3>
          <p className="text-sm text-gray-500">Drafts</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Eye className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">
            {totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews}
          </h3>
          <p className="text-sm text-gray-500">Total Views</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No articles yet</p>
                  <Link href="/admin/news/new" className="text-blue-600 hover:underline mt-2 inline-block">
                    Create your first article
                  </Link>
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 max-w-md">{article.title}</td>
                  <td className="px-6 py-4 text-gray-500 capitalize">{article.category}</td>
                  <td className="px-6 py-4 text-gray-900">{article.author}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {article.publishDate 
                      ? new Date(article.publishDate).toLocaleDateString()
                      : new Date(article.createdAt).toLocaleDateString()
                    }
                  </td>
                  <td className="px-6 py-4 text-gray-900">{article.views}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      article.status === 'published' ? 'bg-green-100 text-green-700' :
                      article.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {article.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/news/${article.id}`} className="text-blue-600 hover:text-blue-700">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
