import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import BayManager from '@/components/admin/workshop/BayManager';

export default async function ManageBaysPage() {
  await requirePermission('canManageBays');

  const bays = await prisma.serviceBay.findMany({
    orderBy: [{ bayType: 'asc' }, { name: 'asc' }],
  });

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
