import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import CrmDashboard from '@/components/admin/crm/CrmDashboard';

export default async function CrmDashboardPage() {
  await requirePermission('canViewReports');

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Dashboard"
        description="End-to-end sales lifecycle: leads, quotations, orders, delivery, revenue, and agent performance"
      />
      <CrmDashboard />
    </div>
  );
}
