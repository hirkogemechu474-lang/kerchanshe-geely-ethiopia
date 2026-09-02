import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import TechnicianManager from '@/components/admin/workshop/TechnicianManager';

export default async function TechniciansPage() {
  await requirePermission('canManageTechnicians');

  const client = await serverApiClient();
  const { data: rows } = await client.get('/admin/workshop/technicians');

  const technicians = rows.map((t: any) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    skillLevel: t.skillLevel,
    certificationLevel: t.certificationLevel,
    isActive: t.isActive,
    jobCardCount: t._count.jobCards,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Technicians"
        description="Manage the technician roster used for job card and bay assignment"
      />
      <TechnicianManager initialTechnicians={technicians} />
    </div>
  );
}
