import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import LoyaltyManagement from '@/components/admin/loyalty/LoyaltyManagement';

export default async function LoyaltyPage() {
  await requirePermission('canManageCustomers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loyalty Program"
        description="Manage customer loyalty accounts, points, tiers, and rewards"
      />
      <LoyaltyManagement />
    </div>
  );
}
