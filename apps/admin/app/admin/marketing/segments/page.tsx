import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import SegmentsManager from '@/components/admin/marketing/SegmentsManager';

export default async function CustomerSegmentsPage() {
  await requirePermission('canManagePromotions');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Segments"
        description="Target customers by loyalty tier, vehicle owned, or service recency, and send a campaign to the matching list."
      />
      <SegmentsManager />
    </div>
  );
}
