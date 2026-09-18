import { requireAuth } from '@/lib/auth/middleware';
import SalesDashboard from '@/components/admin/sales/SalesDashboard';

// The daily operational dashboard — every authenticated staff member sees
// it (matches GET /api/analytics/sales-dashboard's own gate: requireAdminApiSession
// only, no canViewExecutiveDashboards), unlike the Executive Overview.
export default async function SalesDashboardPage() {
  await requireAuth();
  return <SalesDashboard />;
}
