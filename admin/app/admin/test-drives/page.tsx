import { requirePermission } from '@/lib/auth/middleware';
import Link from 'next/link';
import { Plus, Calendar as CalendarIcon, List, Filter } from 'lucide-react';
import TestDriveStats from '@/components/admin/test-drives/TestDriveStats';
import TestDriveList from '@/components/admin/test-drives/TestDriveList';
import TestDriveCalendar from '@/components/admin/test-drives/TestDriveCalendar';
import { prisma } from '@/lib/prisma';

export default async function TestDrivesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requirePermission('canViewTestDrives');
  const { view } = await searchParams;
  const activeView = view || 'list';
  const rows = await prisma.testDrive.findMany({
    orderBy: { createdAt: 'desc' },
    include: { vehicle: { select: { name: true } } },
  });
  const testDrives = rows.map((row) => ({
    id: row.id,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    vehicleModel: row.vehicle.name,
    date: row.preferredDate.toISOString(),
    time: row.preferredTime,
    location: row.location,
    assignedTo: row.salesRepId || 'Unassigned',
    status: row.status as 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
    createdAt: row.createdAt.toISOString(),
    notes: row.specialRequests || undefined,
  }));
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRows = rows.filter((row) => row.createdAt >= monthStart);
  const stats = {
    total: monthRows.length,
    pending: rows.filter((row) => row.status === 'pending').length,
    confirmed: rows.filter((row) => row.status === 'confirmed').length,
    completed: rows.filter((row) => row.status === 'completed').length,
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Drive Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Schedule and manage customer test drive bookings
          </p>
        </div>
        <Link
          href="/admin/test-drives/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Schedule Test Drive
        </Link>
      </div>

      {/* Stats */}
      <TestDriveStats stats={stats} />

      {/* View Toggle */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Link
              href="/admin/test-drives?view=list"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
              List View
            </Link>
            <Link
              href="/admin/test-drives?view=calendar"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CalendarIcon className="w-5 h-5" />
              Calendar View
            </Link>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
      </div>

      {/* Content */}
      {activeView === 'calendar' ? <TestDriveCalendar events={calendarEvents} /> : <TestDriveList testDrives={testDrives} />}
    </div>
  );
}
