import { requirePermission } from '@/lib/auth/middleware';
import SalesTargetsSettings from '@/components/admin/sales/SalesTargetsSettings';

// Same manager-tier gate as the Executive Overview data it feeds
// (canViewExecutiveDashboards) — see backend/src/routes/sales-targets.routes.ts.
export default async function SalesTargetsPage() {
  await requirePermission('canViewExecutiveDashboards');
  return <SalesTargetsSettings />;
}
