import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import OrdersList from '@/components/admin/sales/OrdersList';

export default async function OrdersPage() {
  await requirePermission('canViewQuotations');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders"
        description="Orders booked from accepted quotations, financing status, and PDI sign-off before delivery"
      />
      <OrdersList />
    </div>
  );
}
