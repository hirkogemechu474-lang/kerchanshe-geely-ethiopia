import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader, LinkButton } from '@/components/admin/ui';
import { Plus } from 'lucide-react';
import CategoryList from '@/components/admin/categories/CategoryList';

export default async function CategoriesPage() {
  await requirePermission('canManageVehicles');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Vehicle categories shown in the public site's model filters and mega menu"
        actions={
          <LinkButton href="/admin/categories/new">
            <Plus className="w-4 h-4" />
            Add Category
          </LinkButton>
        }
      />
      <CategoryList />
    </div>
  );
}
