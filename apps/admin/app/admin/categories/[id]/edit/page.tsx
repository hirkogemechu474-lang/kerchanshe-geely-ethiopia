import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import CategoryForm from '@/components/admin/categories/CategoryForm';



export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageVehicles');

  const client = await serverApiClient();

  let category: any;
  try {
    const { data } = await client.get(`/vehicles/categories/${id}`);
    category = data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  const { data: brands } = await client.get('/vehicles/brands');

  return <CategoryForm category={category as any} brands={brands} isEdit={true} />;
}
