import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import SlaMonitor from '@/components/admin/crm/SlaMonitor';

export default async function SlaPage() {
  await requirePermission('canManageOrders');

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Monitor"
        description="Service-level agreement timers across the sales and service workflow"
      />
      <SlaMonitor />
    </div>
  );
}
