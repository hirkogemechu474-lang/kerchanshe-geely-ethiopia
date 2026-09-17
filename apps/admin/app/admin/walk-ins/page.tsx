import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader, LinkButton } from '@/components/admin/ui';
import { Plus } from 'lucide-react';
import WalkInList from '@/components/admin/walk-ins/WalkInList';

export default async function WalkInsPage() {
  await requirePermission('canManageTestDrives');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Walk-in Registrations"
        description="Record customer info for walk-in visitors who don't have a smartphone"
        actions={
          <LinkButton href="/admin/walk-ins/new">
            <Plus className="w-4 h-4" />
            New Registration
          </LinkButton>
        }
      />
      <WalkInList />
    </div>
  );
}
