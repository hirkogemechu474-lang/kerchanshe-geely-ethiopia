import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import WarrantyClaimList from '@/components/admin/workshop/WarrantyClaimList';

export default async function WarrantyClaimsPage() {
  await requirePermission('canViewJobCards');

  const rows = await prisma.warrantyClaim.findMany({
    orderBy: { createdAt: 'desc' },
    include: { jobCard: { select: { jobCardNo: true, plateNo: true, customerName: true } } },
    take: 200,
  });

  const claims = rows.map((c) => ({
    id: c.id,
    claimNo: c.claimNo,
    defectCode: c.defectCode,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    jobCardNo: c.jobCard.jobCardNo,
    plateNo: c.jobCard.plateNo,
    customerName: c.jobCard.customerName,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warranty Claims"
        description="Claims submitted against job cards, tracked from draft through OEM reimbursement"
      />
      <WarrantyClaimList initialClaims={claims} />
    </div>
  );
}
