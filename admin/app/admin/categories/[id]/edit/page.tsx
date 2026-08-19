import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CategoryForm from '@/components/admin/categories/CategoryForm';



export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageContent');

  const category = await prisma.vehicleCategory.findUnique({
    where: { id: id },
  });

  if (!category) {
    notFound();
  }

  const brands = await prisma.vehicleBrand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return <CategoryForm category={category as any} brands={brands} isEdit={true} />;
}
