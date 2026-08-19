import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ElectricPageForm from '@/components/admin/electric/ElectricPageForm';
import { PageHeader, Card } from '@/components/admin/ui';

export default async function NewElectricPage() {
  await requirePermission('canManageContent');

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
          title="Create Electric Page"
          description="Build a new electric mobility content page"
        />
      </div>

      <Card>
        <ElectricPageForm mode="create" />
      </Card>
    </div>
  );
}
