import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import BayManager from '@/components/admin/workshop/BayManager';

export default async function ManageBaysPage() {
  await requirePermission('canManageBays');

  const client = await serverApiClient();
  const { data } = await client.get('/admin/workshop/bays');
  const bays = [...data].sort((a: any, b: any) => a.bayType.localeCompare(b.bayType) || a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bay Management"
        description="Define the physical bays (general, diagnostic, alignment, quick-service, PDI) used by the scheduling board"
      />
      <BayManager initialBays={bays} />
    </div>
  );
}
