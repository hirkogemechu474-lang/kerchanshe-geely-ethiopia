import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import WorkshopBiDashboard from '@/components/admin/workshop/WorkshopBiDashboard';

export default async function WorkshopBiDashboardPage() {
  const session = await requirePermission('canViewExecutiveDashboards');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshop BI"
        description="Monthly workshop performance — first-time-fix rate, turnaround, warranty outcomes, and revenue mix"
      />
      <WorkshopBiDashboard canExport={session.user.permissions.canExportReports} />
    </div>
  );
}
