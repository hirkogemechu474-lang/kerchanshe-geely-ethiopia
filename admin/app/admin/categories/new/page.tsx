import { requirePermission } from '@/lib/auth/middleware';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import { prisma } from '@/lib/prisma';



export default async function NewCategoryPage() {
  await requirePermission('canManageContent');

  // Fetch brands for dropdown
  const brands = await prisma.vehicleBrand.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return <CategoryForm brands={brands} />;
}
