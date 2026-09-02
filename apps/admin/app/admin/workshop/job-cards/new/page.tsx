import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import JobCardWriteUpForm from '@/components/admin/workshop/JobCardWriteUpForm';

export default async function NewJobCardPage() {
  await requirePermission('canManageJobCards');

  const [technicians, bays] = await Promise.all([
    prisma.technician.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.serviceBay.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Create Job Card" description="Write-up: capture the vehicle, customer, and complaint (BRD UC-04)" />
      <JobCardWriteUpForm
        technicians={technicians.map((t) => ({ id: t.id, name: t.name }))}
        bays={bays.map((b) => ({ id: b.id, name: b.name, bayType: b.bayType }))}
      />
    </div>
  );
}
