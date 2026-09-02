import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader } from '@/components/admin/ui';
import StaffSignaturesTable from '@/components/admin/users/StaffSignaturesTable';
import { env } from '@/lib/env';

// Lets a super admin / anyone with canManageUsers send each staff member a
// link to set up their signature (web/app/staff-signature/[token]), then
// see who has one on file. Once set, agreement/handover countersign
// actions stamp that actual signature image instead of just the person's
// typed name — see web/app/api/agreement/[orderId]/countersign-stamp.
export default async function StaffSignaturesPage() {
  await requirePermission('canManageUsers');

  let users: any[] = [];
  try {
    const client = await serverApiClient();
    const { data } = await client.get('/admin/users/signatures');
    users = data;
  } catch (error) {
    console.error('Error fetching staff signatures:', error);
  }

  const webAppUrl = env.app.url.replace(/\/$/, '');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Signatures"
        description="Send each sales agent or manager a link to set up their signature, used automatically when they countersign agreements and handovers"
      />

      <StaffSignaturesTable users={JSON.parse(JSON.stringify(users))} webAppUrl={webAppUrl} />
    </div>
  );
}
