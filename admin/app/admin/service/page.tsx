import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { Calendar, CheckCircle, Clock, Wrench } from 'lucide-react';

function statusClass(status: string) {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'in_progress') return 'bg-yellow-100 text-yellow-700';
  if (status === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
}

export default async function ServicePage() {
  await requirePermission('canManageService');

  const [bookings, scheduled, inProgress, completed, technicians] = await Promise.all([
    prisma.serviceBooking.findMany({ orderBy: { date: 'desc' }, take: 100 }),
    prisma.serviceBooking.count({ where: { status: 'scheduled' } }),
    prisma.serviceBooking.count({ where: { status: 'in_progress' } }),
    prisma.serviceBooking.count({ where: { status: 'completed' } }),
    prisma.serviceBooking.findMany({ where: { technician: { not: null } }, select: { technician: true }, distinct: ['technician'] }),
  ]);

  const cards = [
    { label: 'Scheduled', value: scheduled, icon: Calendar, color: 'text-blue-600' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-yellow-600' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Technicians', value: technicians.length, icon: Wrench, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Service Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">Live service appointments submitted from the public website.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-6">
            <Icon className={`mb-3 h-8 w-8 ${color}`} />
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[900px]">
          <thead className="border-b bg-gray-50">
            <tr>
              {['Customer', 'Vehicle', 'Service', 'Date', 'Technician', 'Status'].map((heading) => <th key={heading} className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">{heading}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4"><div className="font-medium text-gray-900">{booking.customerName}</div><div className="text-xs text-gray-500">{booking.customerPhone} · {booking.customerEmail}</div></td>
                <td className="px-6 py-4 text-gray-600">{booking.vehicleInfo}</td>
                <td className="px-6 py-4 text-gray-900">{booking.serviceType}</td>
                <td className="px-6 py-4 text-gray-600">{booking.date.toLocaleDateString()}</td>
                <td className="px-6 py-4 text-gray-900">{booking.technician || 'Unassigned'}</td>
                <td className="px-6 py-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(booking.status)}`}>{booking.status.replace('_', ' ').toUpperCase()}</span></td>
              </tr>
            ))}
            {bookings.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No service bookings have been submitted yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
