import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import ElectricPageForm from '@/components/admin/electric/ElectricPageForm';
import { prisma } from '@/lib/prisma';
import { PageHeader, Card } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'Edit Page - Electric Menu',
  description: 'Edit electric content page',
};

async function getPage(id: string) {
  try {
    return await prisma.electricMenuPage.findUnique({
      where: { id },
      include: {
        item: {
          include: {
            section: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export default async function EditElectricPagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  const page = await getPage(id);

  if (!page) {
    notFound();
  }

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
          <PageHeader title="Edit Electric Page" description={`Update "${page.title}" page content`} />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Changes will be visible immediately on the public website</li>
          <li>• Setting "Published" to OFF will hide this page from visitors</li>
          <li>• Menu items linking to this page won't work if unpublished</li>
          <li>• Changing the slug will affect the page URL and any bookmarks</li>
        </ul>
      </div>

      {/* Preview Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">🔗 Page Links</h3>
        <div className="flex gap-4 text-sm">
          <Link
            href={`/electric/${page.slug}`}
            target="_blank"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            View Live Page →
          </Link>
          <Link
            href="/admin/electric"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            ← Back to Electric Menu
          </Link>
        </div>
      </div>

      {/* Form */}
      <Card>
        <ElectricPageForm page={page} mode="edit" />
      </Card>
    </div>
  );
}