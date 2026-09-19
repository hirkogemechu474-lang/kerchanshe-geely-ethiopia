import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import ServiceCheckInList from '@/components/admin/crm/ServiceCheckInList';

export default async function ServiceCheckInPage() {
  await requirePermission('canManageServiceBookings');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Check-In"
        description="Look up customer vehicles, check them in for service, and monitor the queued check-ins awaiting a job card."
      />
      <ServiceCheckInList />
    </div>
  );
}
