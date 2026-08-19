import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import ElectricSectionForm from '@/components/admin/electric/ElectricSectionForm';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Edit Section - Electric Menu',
  description: 'Edit electric menu section',
};

async function getSection(id: string) {
  try {
    return await prisma.electricSection.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error('Error fetching section:', error);
    return null;
  }
}

export default async function EditElectricSectionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  const section = await getSection(id);

  if (!section) {
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Electric Section</h1>
          <p className="text-gray-600 mt-1">
            Update "{section.title}" section details
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Changes will be visible immediately on the public website</li>
          <li>• Setting "Active" to OFF will hide this section from the menu</li>
          <li>• Deleting this section will also delete all items within it</li>
          <li>• Changing the slug will affect any bookmarked URLs</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ElectricSectionForm section={section} mode="edit" />
      </div>
    </div>
  );
}