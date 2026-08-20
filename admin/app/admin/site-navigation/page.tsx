import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import SiteNavManager from '@/components/admin/site-nav/SiteNavManager';

export default async function SiteNavigationPage() {
  await requirePermission('canManageContent');

  const items = await prisma.siteNavItem.findMany({
    orderBy: [{ placement: 'asc' }, { displayOrder: 'asc' }],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Navigation"
        description="The header's main navigation bar and the Models dropdown's Quick Actions panel"
      />
      <SiteNavManager
        topNav={items.filter((i) => i.placement === 'TOP_NAV')}
        quickActions={items.filter((i) => i.placement === 'MODELS_QUICK_ACTIONS')}
      />
    </div>
  );
}
