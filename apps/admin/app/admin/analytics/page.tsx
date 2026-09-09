import { requireAuth } from '@/lib/auth/middleware';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

// The universal post-login landing page for every admin role (see
// app/admin/login/page.tsx and app/admin/dashboard/page.tsx) — so this only
// requires being signed in, not any specific permission. Only the report
// export buttons are gated, on canExportReports.
export default async function AnalyticsPage() {
  const session = await requireAuth();

  return <AnalyticsDashboard canExport={session.permissions.canExportReports} />;
}
