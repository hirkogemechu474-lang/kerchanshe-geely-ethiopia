import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricPageForm from '@/components/admin/electric/ElectricPageForm';
import { PageHeader, Card } from '@/components/admin/ui';

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
        <PageHeader
          title="Edit Electric Page"
          description="Update electric mobility page content"
        />
      </div>

      <Card>
        <ElectricPageForm pageId={id} mode="edit" />
      </Card>
    </div>
  );
}
