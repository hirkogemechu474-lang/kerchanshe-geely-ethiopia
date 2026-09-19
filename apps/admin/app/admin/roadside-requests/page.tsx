import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { AlertTriangle, Truck, CheckCircle, Clock } from 'lucide-react';
import { PageHeader, StatTile } from '@/components/admin/ui';
import RoadsideRequestsList from '@/components/admin/RoadsideRequestsList';

export default async function RoadsideRequestsPage() {
  await requirePermission('canManageService');

  const client = await serverApiClient();
  const { data } = await client.get('/roadside-requests', { params: { pageSize: 100 } });
  const requests = data.items;

  const counts = {
    new: requests.filter((r: any) => r.status === 'NEW').length,
    dispatched: requests.filter((r: any) => r.status === 'DISPATCHED' || r.status === 'IN_PROGRESS').length,
    resolved: requests.filter((r: any) => r.status === 'RESOLVED').length,
    unsafe: requests.filter((r: any) => !r.isVehicleSafe && r.status !== 'RESOLVED' && r.status !== 'CANCELLED').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roadside Assistance"
        description="24/7 dispatch requests submitted from the public website's Roadside Assistance page."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatTile label="New" value={counts.new} icon={AlertTriangle} />
        <StatTile label="Dispatched / In Progress" value={counts.dispatched} icon={Truck} />
        <StatTile label="Resolved" value={counts.resolved} icon={CheckCircle} />
        <StatTile label="Unsafe Location (Active)" value={counts.unsafe} icon={Clock} />
      </div>

      <RoadsideRequestsList requests={requests} />
    </div>
  );
}
