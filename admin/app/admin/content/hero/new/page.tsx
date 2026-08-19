import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import HeroSectionForm from '@/components/admin/hero/HeroSectionForm';

export default async function NewHeroPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader title="Create Hero Section" description="Add a new hero banner to the homepage carousel" />

      <HeroSectionForm />
    </div>
  );
}
