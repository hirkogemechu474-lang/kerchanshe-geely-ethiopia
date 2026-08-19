import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import TechnicianManager from '@/components/admin/workshop/TechnicianManager';

export default async function TechniciansPage() {
  await requirePermission('canManageTechnicians');

  const rows = await prisma.technician.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { jobCards: true } } },
  });

  const technicians = rows.map((t) => ({
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
