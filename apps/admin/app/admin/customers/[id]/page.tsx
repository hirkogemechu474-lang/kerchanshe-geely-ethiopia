import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import CustomerDetail from '@/components/admin/customers/CustomerDetail';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewJobCards');
  const { id } = await params;

  const client = await serverApiClient();
  let customer;
  try {
    const res = await client.get(`/customers/${id}`);
    customer = res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) notFound();
    throw error;
  }

  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <CustomerDetail customer={customer} permissions={session.user.permissions} />
    </div>
  );
}
