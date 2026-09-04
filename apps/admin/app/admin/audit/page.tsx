import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import AuditList from '@/components/admin/crm/AuditList';

export default async function AuditPage() {
  await requirePermission('canViewReports');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Immutable trail of key actions across quotations, orders, leads, complaints, warranty, and more"
      />
      <AuditList />
    </div>
  );
}
