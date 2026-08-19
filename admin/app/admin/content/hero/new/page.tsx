import { requirePermission } from '@/lib/auth/middleware';
import HeroSectionForm from '@/components/admin/hero/HeroSectionForm';

export default async function NewHeroPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Hero Section</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new hero banner to the homepage carousel
        </p>
      </div>

      <HeroSectionForm />
    </div>
  );
}
