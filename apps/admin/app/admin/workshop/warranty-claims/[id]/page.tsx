import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WarrantyClaimDetail from '@/components/admin/workshop/WarrantyClaimDetail';

export default async function WarrantyClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewJobCards');
  const { id } = await params;

  const claim = await prisma.warrantyClaim.findUnique({
    where: { id },
    include: {
      jobCard: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    },
  });

  if (!claim) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <WarrantyClaimDetail claim={JSON.parse(JSON.stringify(claim))} permissions={session.user.permissions} />
    </div>
  );
}
