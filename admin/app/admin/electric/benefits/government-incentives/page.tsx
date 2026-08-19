import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ElectricBenefitForm from '@/components/admin/electric/ElectricBenefitForm';
import { prisma } from '@/lib/prisma';



async function getOrCreateBenefit() {
  try {
    let benefit = await prisma.electricPage.findFirst({
      where: { slug: 'government-incentives' },
    });

    if (!benefit) {
      benefit = await prisma.electricPage.create({
        data: {
          title: 'Government Incentives',
          slug: 'government-incentives',
          pageType: 'custom',
          heroTitle: 'Government Incentives & Support',
          heroSubtitle: 'TAX BENEFITS AND SUBSIDIES',
          isPublished: true,
          displayOrder: 11,
        },
      });
    }

    return benefit;
  } catch (error) {
    console.error('Error getting/creating benefit:', error);
    return null;
  } 
}

export default async function GovernmentIncentivesPage() {
  await requirePermission('canManageContent');
  const benefit = await getOrCreateBenefit();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/electric"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-900"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Electric Management
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Government Incentives Page</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage government incentives and subsidies content
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ElectricBenefitForm
          benefitId={benefit?.id}
          benefitType="government-incentives"
        />
      </div>
    </div>
  );
}
