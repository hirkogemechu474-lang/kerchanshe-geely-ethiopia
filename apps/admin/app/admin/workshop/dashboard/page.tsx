import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import WorkshopDashboard from '@/components/admin/workshop/WorkshopDashboard';

export default async function WorkshopDashboardPage() {
  const session = await requirePermission('canViewJobCards');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workshop Live Dashboard"
        description="Real-time bay occupancy, today's jobs, and average turnaround"
      />
      <WorkshopDashboard canExport={session.permissions.canExportReports} />
    </div>
  );
}
