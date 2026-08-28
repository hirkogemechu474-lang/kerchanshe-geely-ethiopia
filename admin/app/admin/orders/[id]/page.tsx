import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import OrderDetail from '@/components/admin/sales/OrderDetail';
import { env } from '@/lib/env';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewQuotations');
  const { id } = await params;
  const webAppUrl = env.app.url.replace(/\/$/, '');

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      pdiItems: { orderBy: { createdAt: 'asc' } },
      statusHistory: { orderBy: { changedAt: 'asc' } },
      quotation: { select: { id: true } },
      testDrives: { orderBy: { createdAt: 'desc' } },
      vehicleAllocation: { include: { vehicle: { select: { id: true, name: true, model: true, stock: true } } } },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <OrderDetail order={JSON.parse(JSON.stringify(order))} permissions={session.user.permissions} role={session.user.role} webAppUrl={webAppUrl} />
    </div>
  );
}
