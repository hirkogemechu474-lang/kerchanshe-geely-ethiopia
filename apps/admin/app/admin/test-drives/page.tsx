import { requirePermission } from '@/lib/auth/middleware';
import { Plus, Calendar as CalendarIcon, List, Filter } from 'lucide-react';
import TestDriveStats from '@/components/admin/test-drives/TestDriveStats';
import TestDriveList from '@/components/admin/test-drives/TestDriveList';
import TestDriveCalendar from '@/components/admin/test-drives/TestDriveCalendar';
import { serverApiClient } from '@/lib/serverApiClient';
import { PageHeader, LinkButton, Card, Button } from '@/components/admin/ui';

export default async function TestDrivesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requirePermission('canViewTestDrives');
  const { view } = await searchParams;
  const activeView = view || 'list';
  const client = await serverApiClient();
  const { data } = await client.get('/test-drives', { params: { pageSize: 300 } });
  const rows = data.items;
  const testDrives = rows.map((row: any) => ({
    id: row.id,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    vehicleModel: row.vehicle.name,
    date: row.preferredDate,
    time: row.preferredTime,
    location: row.location,
    assignedTo: row.salesRepId || 'Unassigned',
    status: row.status as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
    createdAt: row.createdAt,
    notes: row.specialRequests || undefined,
  }));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRows = rows.filter((row: any) => new Date(row.createdAt) >= monthStart);
  const stats = {
    total: monthRows.length,
    pending: rows.filter((row: any) => row.status === 'pending').length,
    confirmed: rows.filter((row: any) => row.status === 'confirmed').length,
    completed: rows.filter((row: any) => row.status === 'completed').length,
  };
  const calendarEvents = testDrives.map((row) => ({
    id: row.id,
    customerName: row.customerName,
    vehicleModel: row.vehicleModel,
    date: row.date,
    time: row.time,
    status: row.status === 'no_show' ? 'cancelled' : row.status,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Drive Management"
        description="Schedule and manage customer test drive bookings"
        actions={
          <LinkButton href="/admin/test-drives/new">
            <Plus className="w-4 h-4" />
            Schedule Test Drive
          </LinkButton>
        }
      />

      {/* Stats */}
      <TestDriveStats stats={stats} />

      {/* View Toggle */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <LinkButton
              href="/admin/test-drives?view=list"
              variant={activeView === 'list' ? 'primary' : 'secondary'}
            >
              <List className="w-4 h-4" />
              List View
            </LinkButton>
            <LinkButton
              href="/admin/test-drives?view=calendar"
              variant={activeView === 'calendar' ? 'primary' : 'secondary'}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar View
            </LinkButton>
          </div>
          <Button variant="secondary">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Content */}
      {activeView === 'calendar' ? <TestDriveCalendar events={calendarEvents} /> : <TestDriveList testDrives={testDrives} />}
    </div>
  );
}
