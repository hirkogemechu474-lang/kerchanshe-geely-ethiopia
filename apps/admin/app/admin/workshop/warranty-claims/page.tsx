import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import WarrantyClaimList from '@/components/admin/workshop/WarrantyClaimList';

export default async function WarrantyClaimsPage() {
  await requirePermission('canViewJobCards');

  const client = await serverApiClient();
  const { data } = await client.get('/admin/workshop/warranty-claims', { params: { pageSize: 200 } });
  const rows = data.items;

  const claims = rows.map((c: any) => ({
    id: c.id,
    claimNo: c.claimNo,
    defectCode: c.defectCode,
    status: c.status,
    createdAt: c.createdAt,
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
