import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import ElectricBenefitForm from '@/components/admin/electric/ElectricBenefitForm';
import { prisma } from '@/lib/prisma';
import { PageHeader, Card } from '@/components/admin/ui';
async function getOrCreateBenefit() {
  try {
    let benefit = await prisma.electricPage.findFirst({
      where: { slug: 'cost-calculator' },
    });

    if (!benefit) {
      benefit = await prisma.electricPage.create({
        data: {
          title: 'Cost Calculator',
          slug: 'cost-calculator',
          pageType: 'custom',
          heroTitle: 'Calculate Your Savings',
          heroSubtitle: 'DISCOVER HOW MUCH YOU\'LL SAVE',
          isPublished: true,
          displayOrder: 10,
        },
      });
    }

    return benefit;
  } catch (error) {
    console.error('Error getting/creating benefit:', error);
    return null;
  } 
}

export default async function CostCalculatorPage() {
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

      <PageHeader title="Cost Calculator Page" description="Manage the cost calculator content and appearance" />

      <Card>
        <ElectricBenefitForm
          benefitId={benefit?.id}
          benefitType="cost-calculator"
        />
      </Card>
    </div>
  );
}
