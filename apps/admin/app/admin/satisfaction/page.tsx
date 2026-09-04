import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import SatisfactionList from '@/components/admin/crm/SatisfactionList';

export default async function SatisfactionPage() {
  await requirePermission('canManageCustomers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Satisfaction"
        description="NPS scorecard, post-delivery follow-up calls, and satisfaction tracking"
      />
      <SatisfactionList />
    </div>
  );
}
