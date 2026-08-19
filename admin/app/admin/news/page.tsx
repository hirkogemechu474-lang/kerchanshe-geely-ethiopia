import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, FileText, Eye, Calendar, Edit } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { PageHeader, LinkButton, StatTile, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyState, type Tone } from '@/components/admin/ui';

function articleStatusTone(status: string): Tone {
  if (status === 'published') return 'green';
  if (status === 'draft') return 'gray';
  return 'blue';
}

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
      <PageHeader
        title="News & Content"
        description="Manage news articles and blog posts"
        actions={
          <LinkButton href="/admin/news/new">
            <Plus className="w-4 h-4" />
            New Article
          </LinkButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatTile label="Total Articles" value={totalArticles} icon={FileText} />
        <StatTile label="Scheduled" value={scheduledArticles} icon={Calendar} />
        <StatTile label="Drafts" value={draftArticles} icon={Edit} />
        <StatTile label="Total Views" value={totalViews > 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews} icon={Eye} />
      </div>

      <TableCard>
        <THead>
          <tr>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Author</Th>
            <Th>Date</Th>
            <Th>Views</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </THead>
        <TBody>
          {articles.length === 0 ? (
            <tr>
              <td colSpan={7}>
                <EmptyState
                  icon={FileText}
                  title="No articles yet"
                  action={
                    <Link href="/admin/news/new" className="text-blue-600 hover:underline">
                      Create your first article
                    </Link>
                  }
                />
              </td>
            </tr>
          ) : (
            articles.map((article) => (
              <Tr key={article.id}>
                <Td className="font-medium text-gray-900 max-w-md">{article.title}</Td>
                <Td className="capitalize">{article.category}</Td>
                <Td className="text-gray-900">{article.author}</Td>
                <Td>
                  {article.publishDate
                    ? new Date(article.publishDate).toLocaleDateString()
                    : new Date(article.createdAt).toLocaleDateString()
                  }
                </Td>
                <Td className="text-gray-900">{article.views}</Td>
                <Td>
                  <Badge tone={articleStatusTone(article.status)}>{article.status.toUpperCase()}</Badge>
                </Td>
                <Td className="text-right">
                  <Link href={`/admin/news/${article.id}`} className="text-blue-600 hover:text-blue-700">
                    Edit
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>
    </div>
  );
}
