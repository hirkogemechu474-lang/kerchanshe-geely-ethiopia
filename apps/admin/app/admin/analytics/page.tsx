import { requireAuth } from '@/lib/auth/middleware';
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard';

// The universal post-login landing page for every admin role (see
// app/admin/login/page.tsx and app/admin/dashboard/page.tsx) — so this only
// requires being signed in, not any specific permission (hard-gating it would
// lock every non-manager role out of their own post-login landing page).
// Report export is gated on canExportReports; the full executive-level
// charts (not just this user's own tiles) are gated on
// canViewExecutiveDashboards — both checked inside AnalyticsDashboard.
export default async function AnalyticsPage() {
  const session = await requireAuth();

  return (
    <AnalyticsDashboard
      canExport={session.permissions.canExportReports}
      canViewExecutive={session.permissions.canViewExecutiveDashboards}
    />
  );
}
