import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricPageForm from '@/components/admin/electric/ElectricPageForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditElectricPage({ params }: PageProps) {
  await requirePermission('canManageContent');
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/electric"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Electric Page</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update electric mobility page content
          </p>
        </div>
      </div>

      <ElectricPageForm pageId={id} mode="edit" />
    </div>
  );
}
