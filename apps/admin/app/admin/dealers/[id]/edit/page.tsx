import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import DealerForm from '@/components/admin/dealers/DealerForm';



export default async function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageDealers');

  const client = await serverApiClient();
  let dealer;
  try {
    const res = await client.get(`/dealers/${id}`);
    dealer = res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) notFound();
    throw error;
  }

  if (!dealer) {
    notFound();
  }

  return <DealerForm dealer={dealer as any} isEdit={true} />;
}
