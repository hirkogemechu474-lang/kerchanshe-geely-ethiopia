import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import SiteNavManager from '@/components/admin/site-nav/SiteNavManager';

export default async function SiteNavigationPage() {
  await requirePermission('canManageContent');

  let items: any[] = [];
  try {
    const client = await serverApiClient();
    const { data } = await client.get('/content/site-nav', { params: { placement: 'TOP_NAV' } });
    items = data;
  } catch (error) {
    console.error('Error fetching site nav items:', error);
  }

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
