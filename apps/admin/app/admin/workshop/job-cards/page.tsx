import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { Plus } from 'lucide-react';
import { PageHeader, LinkButton } from '@/components/admin/ui';
import JobCardList from '@/components/admin/workshop/JobCardList';

export default async function JobCardsPage() {
  await requirePermission('canViewJobCards');

  const client = await serverApiClient();
  const { data } = await client.get('/admin/workshop/job-cards', { params: { pageSize: 200 } });
  const rows = data.items;

  const jobCards = rows.map((j: any) => ({
    id: j.id,
    jobCardNo: j.jobCardNo,
    plateNo: j.plateNo,
    vehicleModel: j.vehicleModel,
    customerName: j.customerName,
    customerPhone: j.customerPhone,
    status: j.status,
    technicianName: j.technician?.name || null,
    bayName: j.bay?.name || null,
    openTs: j.openTs,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Cards"
        description="Every vehicle currently or previously moving through the workshop"
        actions={
          <LinkButton href="/admin/workshop/job-cards/new">
            <Plus className="w-4 h-4" />
            New Job Card
          </LinkButton>
        }
      />
      <JobCardList initialJobCards={jobCards} />
    </div>
  );
}
