import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import RepeatPurchaseList from '@/components/admin/crm/RepeatPurchaseList';

export default async function RepeatPurchasePage() {
  await requirePermission('canManageCustomers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repeat Purchase"
        description="Upgrade and trade-in opportunities for existing customers, auto-detected from service data"
      />
      <RepeatPurchaseList />
    </div>
  );
}
