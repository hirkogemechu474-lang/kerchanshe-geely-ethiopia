import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import WarrantyClaimDetail from '@/components/admin/workshop/WarrantyClaimDetail';

export default async function WarrantyClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canManageWarrantyClaims');
  const { id } = await params;
  const client = await serverApiClient();

  let claim: any;
  try {
    const res = await client.get(`/admin/workshop/warranty-claims/${id}`);
    claim = res.data.claim;
  } catch (err: any) {
    if (err?.response?.status === 404) notFound();
    throw err;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <WarrantyClaimDetail claim={claim} permissions={session.user.permissions} />
    </div>
  );
}
