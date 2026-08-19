import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import JobCardDetail from '@/components/admin/workshop/JobCardDetail';

export default async function JobCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewJobCards');
  const { id } = await params;

  const [jobCard, technicians, bays, spareParts] = await Promise.all([
    prisma.jobCard.findUnique({
      where: { id },
      include: {
        technician: true,
        bay: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
        jobCardParts: { include: { sparePart: true }, orderBy: { requestedAt: 'asc' } },
        warrantyClaims: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.technician.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.serviceBay.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.sparePart.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ]);

  if (!jobCard) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <JobCardDetail
        jobCard={JSON.parse(JSON.stringify(jobCard))}
        technicians={technicians.map((t) => ({ id: t.id, name: t.name }))}
        bays={bays.map((b) => ({ id: b.id, name: b.name, bayType: b.bayType }))}
        spareParts={spareParts.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stock, reservedQty: p.reservedQty }))}
        permissions={session.user.permissions}
      />
    </div>
  );
}
