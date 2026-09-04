import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import DealershipWorkflow from '@/components/admin/workflow/DealershipWorkflow';

export default async function WorkflowPage() {
  await requirePermission('canViewReports');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealership Workflow"
        description="Track the complete customer lifecycle from first inquiry to repeat purchase"
      />
      <DealershipWorkflow />
    </div>
  );
}
