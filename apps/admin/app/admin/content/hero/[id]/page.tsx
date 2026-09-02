import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import HeroSectionForm from '@/components/admin/hero/HeroSectionForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHeroPage({ params }: PageProps) {
  await requirePermission('canManageContent');
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Hero Section" description="Update homepage hero banner content" />

      <HeroSectionForm heroId={id} />
    </div>
  );
}
