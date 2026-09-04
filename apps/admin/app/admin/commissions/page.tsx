import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import CommissionList from '@/components/admin/crm/CommissionList';

export default async function CommissionsPage() {
  await requirePermission('canManageOrders');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Management"
        description="Track sales commission ownership, splits, earned amounts, and payroll pay-outs"
      />
      <CommissionList />
    </div>
  );
}
