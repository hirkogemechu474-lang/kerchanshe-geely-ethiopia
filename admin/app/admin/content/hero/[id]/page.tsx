import { requirePermission } from '@/lib/auth/middleware';
import HeroSectionForm from '@/components/admin/hero/HeroSectionForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHeroPage({ params }: PageProps) {
  await requirePermission('canManageContent');
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Hero Section</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update homepage hero banner content
        </p>
      </div>

      <HeroSectionForm heroId={id} />
    </div>
  );
}
