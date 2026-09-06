import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Edit, Eye, EyeOff, ExternalLink, FileText } from 'lucide-react';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader, LinkButton, Card, StatTile, TableCard, THead, TBody, Tr, Th, Td, EmptyState, Badge } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'Service Pages - Services Menu',
  description: 'Manage service pages',
};

async function getPages() {
  try {
    const client = await serverApiClient();
    const { data } = await client.get('/services-menu/pages');
    return data;
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
      <PageHeader
        title="Service Pages"
        description="Manage content pages for your services"
        actions={
          <LinkButton href="/admin/services-menu/pages/new">
            <Plus className="w-4 h-4" />
            Create Page
          </LinkButton>
        }
      />

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
        <StatTile label="Total Pages" value={pages.length} />
        <StatTile label="Published" value={pages.filter((p: any) => p.isPublished).length} />
        <StatTile label="Drafts" value={pages.filter((p: any) => !p.isPublished).length} />
      </div>

      {/* Pages List */}
      {pages.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={FileText}
            title="No pages yet"
            description="Create your first service page to get started"
            action={
              <LinkButton href="/admin/services-menu/pages/new">
                <Plus className="w-4 h-4" />
                Create First Page
              </LinkButton>
            }
          />
        </Card>
      ) : (
        <TableCard>
          <THead>
            <tr>
              <Th>Page</Th>
              <Th>Slug (URL)</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </THead>
          <TBody>
            {pages.map((page: any) => (
              <Tr key={page.id}>
                <Td>
                  <div className="font-medium text-gray-900">{page.title}</div>
                  {page.excerpt && (
                    <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {page.excerpt}
                    </div>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      /services/{page.slug}
                    </code>
                    {page.isPublished && (
                      <a
                        href={`/services/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-geely-blue hover:text-navy"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-col items-start gap-1">
                    {page.isPublished ? (
                      <Badge tone="green">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Published
                        </span>
                      </Badge>
                    ) : (
                      <Badge tone="gray">
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Draft
                        </span>
                      </Badge>
                    )}
                    <Badge tone={page.status === 'PUBLISHED' ? 'green' : page.status === 'SCHEDULED' ? 'orange' : 'gray'}>
                      {page.status === 'PUBLISHED' ? 'Published' : page.status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
                    </Badge>
                  </div>
                </Td>
                <Td className="text-gray-500">
                  {new Date(page.updatedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/services-menu/pages/${page.id}/edit`}
                      className="p-2 text-geely-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit page"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </TableCard>
      )}
    </div>
  );
}
