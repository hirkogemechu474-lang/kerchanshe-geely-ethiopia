import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import WarrantyList from '@/components/admin/crm/WarrantyList';

export default async function WarrantyPage() {
  await requirePermission('canViewJobCards');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warranty Register"
        description="Active warranties, upcoming service reminders, and service history tracking"
      />
      <WarrantyList />
    </div>
  );
}
