import { requirePermission } from '@/lib/auth/middleware';
import CrmDashboard from '@/components/admin/crm/CrmDashboard';

// PageHeader lives inside CrmDashboard itself (matches AnalyticsDashboard's
// pattern) so its Refresh action can reach the client component's load()
// callback without threading it through this server component.
export default async function CrmDashboardPage() {
  const session = await requirePermission('canViewExecutiveDashboards');

  return <CrmDashboard canExport={session.permissions.canExportReports} />;
}
