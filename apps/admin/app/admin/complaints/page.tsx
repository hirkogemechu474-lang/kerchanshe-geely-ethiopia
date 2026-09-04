import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import ComplaintList from '@/components/admin/crm/ComplaintList';

export default async function ComplaintsPage() {
  await requirePermission('canManageCustomers');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        description="Customer complaint cases, priority escalations, status tracking, and internal notes"
      />
      <ComplaintList />
    </div>
  );
}
