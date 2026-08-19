import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import DealerForm from '@/components/admin/dealers/DealerForm';



export default async function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageDealers');

  const dealer = await prisma.dealer.findUnique({
    where: { id: id },
  });

  if (!dealer) {
    notFound();
  }

  return <DealerForm dealer={dealer as any} isEdit={true} />;
}
