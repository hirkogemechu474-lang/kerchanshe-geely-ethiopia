import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import JobCardWriteUpForm from '@/components/admin/workshop/JobCardWriteUpForm';

export default async function NewJobCardPage() {
  await requirePermission('canManageJobCards');

  const client = await serverApiClient();
  const [{ data: technicians }, { data: bays }] = await Promise.all([
    client.get('/admin/workshop/technicians'),
    client.get('/admin/workshop/bays'),
  ]);

  const activeTechnicians = technicians.filter((t: any) => t.isActive);
  const activeBays = bays.filter((b: any) => b.isActive);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Create Job Card" description="Write-up: capture the vehicle, customer, and complaint (BRD UC-04)" />
      <JobCardWriteUpForm
        technicians={activeTechnicians.map((t: any) => ({ id: t.id, name: t.name }))}
        bays={activeBays.map((b: any) => ({ id: b.id, name: b.name, bayType: b.bayType }))}
      />
    </div>
  );
}
