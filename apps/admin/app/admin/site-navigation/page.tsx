import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/admin/ui';
import SiteNavManager from '@/components/admin/site-nav/SiteNavManager';

export default async function SiteNavigationPage() {
  await requirePermission('canManageContent');

  const items = await prisma.siteNavItem.findMany({
    where: { placement: 'TOP_NAV' },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Navigation"
        description="Controls both the desktop header's nav bar and the mobile menu drawer on the public site"
      />
      <SiteNavManager topNav={items} />
    </div>
  );
}
