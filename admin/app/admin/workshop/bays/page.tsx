import { requirePermission } from '@/lib/auth/middleware';
import { Settings } from 'lucide-react';
import { PageHeader, LinkButton } from '@/components/admin/ui';
import BayBoard from '@/components/admin/workshop/BayBoard';

export default async function BaySchedulingBoardPage() {
  await requirePermission('canViewJobCards');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bay Scheduling Board"
        description="Visual capacity view of every bay for the selected day — click an unscheduled job or a bay slot to assign it"
        actions={
          <LinkButton href="/admin/workshop/bays/manage" variant="secondary" size="sm">
            <Settings className="w-4 h-4" />
            Manage Bays
          </LinkButton>
        }
      />
      <BayBoard />
    </div>
  );
}
