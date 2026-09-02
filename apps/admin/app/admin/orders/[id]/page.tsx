import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import OrderDetail from '@/components/admin/sales/OrderDetail';
import { env } from '@/lib/env';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewQuotations');
  const { id } = await params;
  const webAppUrl = env.app.url.replace(/\/$/, '');

  const client = await serverApiClient();
  let order;
  try {
    const res = await client.get(`/orders/${id}`);
    order = res.data;
  } catch (error: any) {
    if (error?.response?.status === 404) notFound();
    throw error;
  }

  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <OrderDetail order={order} permissions={session.user.permissions} role={session.user.role} webAppUrl={webAppUrl} />
    </div>
  );
}
