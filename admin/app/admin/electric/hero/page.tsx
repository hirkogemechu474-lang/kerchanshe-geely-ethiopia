import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ElectricHeroForm from '@/components/admin/electric/ElectricHeroForm';
import { prisma } from '@/lib/prisma';
import { PageHeader, Card } from '@/components/admin/ui';



async function getOrCreateHero() {
  try {
    let hero = await prisma.electricPage.findFirst({
      where: { slug: 'hero' },
    });

    if (!hero) {
      hero = await prisma.electricPage.create({
        data: {
          title: 'Electric Hero Section',
          slug: 'hero',
          pageType: 'custom',
          heroTitle: 'Electric Vehicles by Geely',
          heroSubtitle: 'THE FUTURE OF MOBILITY',
          isPublished: true,
          displayOrder: 0,
        },
      });
    }

    return hero;
  } catch (error) {
    console.error('Error getting/creating hero:', error);
    return null;
  } 
}

export default async function EditHeroPage() {
  await requirePermission('canManageContent');
  const hero = await getOrCreateHero();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/electric"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Electric Management
      </Link>

      <PageHeader
        title="Edit Hero Section"
        description="Customize the main Electric page hero banner"
      />

      <Card>
        <ElectricHeroForm heroId={hero?.id} />
      </Card>
    </div>
  );
}
