import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CustomerDetail from '@/components/admin/customers/CustomerDetail';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewJobCards');
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { updatedAt: 'desc' },
        include: {
          jobCards: {
            orderBy: { openTs: 'desc' },
            take: 10,
            select: { id: true, jobCardNo: true, status: true, complaintText: true, openTs: true, closeTs: true },
          },
        },
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <CustomerDetail customer={JSON.parse(JSON.stringify(customer))} permissions={session.user.permissions} />
    </div>
  );
}
