import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import ElectricItemForm from '@/components/admin/electric/ElectricItemForm';
import { prisma } from '@/lib/prisma';
import { PageHeader, Card } from '@/components/admin/ui';

export const metadata: Metadata = {
  title: 'Edit Item - Electric Menu',
  description: 'Edit electric menu item',
};

async function getItem(id: string) {
  try {
    return await prisma.electricItem.findUnique({
      where: { id },
      include: {
        section: true,
        page: true,
      },
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return null;
  }
}

export default async function EditElectricItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/electric"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <PageHeader title="Edit Electric Menu Item" description={`Update "${item.title}" item details`} />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Changes will be visible immediately on the public website</li>
          <li>• Setting "Active" to OFF will hide this item from the menu</li>
          <li>• Linked pages must be published to work on the frontend</li>
          <li>• Featured items get special highlighting in the menu</li>
        </ul>
      </div>

      {/* Form */}
      <Card>
        <ElectricItemForm item={item} mode="edit" />
      </Card>
    </div>
  );
}