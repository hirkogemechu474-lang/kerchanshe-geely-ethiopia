import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, CheckCircle, Clock, Wrench } from 'lucide-react';
import ConvertToJobCardButton from '@/components/admin/workshop/ConvertToJobCardButton';
import { PageHeader, StatTile, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatusBadge } from '@/components/admin/ui';

export default async function ServicePage() {
  await requirePermission('canManageService');

  const [bookings, scheduled, inProgress, completed, technicians] = await Promise.all([
    prisma.serviceBooking.findMany({
      orderBy: { date: 'desc' },
      take: 100,
      include: { jobCard: { select: { id: true, jobCardNo: true } } },
    }),
    prisma.serviceBooking.count({ where: { status: 'scheduled' } }),
    prisma.serviceBooking.count({ where: { status: 'in_progress' } }),
    prisma.serviceBooking.count({ where: { status: 'completed' } }),
    prisma.serviceBooking.findMany({ where: { technician: { not: null } }, select: { technician: true }, distinct: ['technician'] }),
  ]);

  const cards = [
    { label: 'Scheduled', value: scheduled, icon: Calendar, color: 'text-geely-blue' },
    { label: 'In Progress', value: inProgress, icon: Clock, color: 'text-yellow-600' },
    { label: 'Completed', value: completed, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Technicians', value: technicians.length, icon: Wrench, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Bookings"
        description="Live service appointments submitted from the public website."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <StatTile key={label} label={label} value={value} icon={Icon} />
        ))}
      </div>

      <TableCard>
        <THead>
          <tr>
            <Th>Customer</Th>
            <Th>Vehicle</Th>
            <Th>Service</Th>
            <Th>Date</Th>
            <Th>Technician</Th>
            <Th>Status</Th>
            <Th>Job Card</Th>
          </tr>
        </THead>
        <TBody>
          {bookings.map((booking) => (
            <Tr key={booking.id}>
              <Td>
                <div className="font-medium text-gray-900">{booking.customerName}</div>
                <div className="text-xs text-gray-500">{booking.customerPhone} · {booking.customerEmail}</div>
              </Td>
              <Td>{booking.vehicleInfo}</Td>
              <Td className="text-gray-900">{booking.serviceType}</Td>
              <Td>{booking.date.toLocaleDateString()}</Td>
              <Td className="text-gray-900">{booking.technician || 'Unassigned'}</Td>
              <Td><StatusBadge status={booking.status} /></Td>
              <Td>
                {booking.jobCard ? (
                  <Link href={`/admin/workshop/job-cards/${booking.jobCard.id}`} className="text-xs font-medium text-geely-blue hover:underline">
                    {booking.jobCard.jobCardNo}
                  </Link>
                ) : (
                  <ConvertToJobCardButton bookingId={booking.id} />
                )}
              </Td>
            </Tr>
          ))}
          {bookings.length === 0 && <EmptyTableRow colSpan={7} message="No service bookings have been submitted yet." />}
        </TBody>
      </TableCard>
    </div>
  );
}
