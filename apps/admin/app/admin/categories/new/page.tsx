import { requirePermission } from '@/lib/auth/middleware';
import CategoryForm from '@/components/admin/categories/CategoryForm';
import { serverApiClient } from '@/lib/serverApiClient';



export default async function NewCategoryPage() {
  await requirePermission('canManageVehicles');

  // Fetch brands for dropdown
  const client = await serverApiClient();
  const { data: brands } = await client.get('/vehicles/brands');

  return <CategoryForm brands={brands} />;
}
