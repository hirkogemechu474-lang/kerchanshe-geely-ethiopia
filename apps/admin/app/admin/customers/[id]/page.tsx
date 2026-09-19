import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import CustomerDetail from '@/components/admin/customers/CustomerDetail';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewCustomers');
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

  const history = await client.get(`/customers/${id}/history`).then((r) => r.data).catch(() => null);

  return (
    <div className="space-y-6 max-w-4xl">
      <CustomerDetail customer={customer} history={history} permissions={session.user.permissions} />
    </div>
  );
}
