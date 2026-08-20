import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import OrderDetail from '@/components/admin/sales/OrderDetail';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewQuotations');
  const { id } = await params;

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      pdiItems: { orderBy: { createdAt: 'asc' } },
      statusHistory: { orderBy: { changedAt: 'asc' } },
      quotation: { select: { id: true } },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <OrderDetail order={JSON.parse(JSON.stringify(order))} permissions={session.user.permissions} />
    </div>
  );
}
