import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Car, Clock, Mail, MapPin, Phone, User } from 'lucide-react';
import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { Card, StatusBadge } from '@/components/admin/ui';
import TestDriveIdCapture from '@/components/admin/test-drives/TestDriveIdCapture';

export default async function TestDriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requirePermission('canViewTestDrives');
  const { id } = await params;
  const testDrive = await prisma.testDrive.findUnique({
    where: { id },
    include: { vehicle: { select: { name: true, slug: true } } },
  });
  if (!testDrive) notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/test-drives" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"><ArrowLeft className="w-4 h-4" />Back to test drives</Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Drive Booking</h1>
          <p className="mt-1 text-sm text-gray-500">Booking created {testDrive.createdAt.toISOString().slice(0, 10)}</p>
        </div>
        <StatusBadge status={testDrive.status} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
          <div className="flex items-center gap-3"><User className="w-5 h-5 text-gray-400" /><span>{testDrive.customerName}</span></div>
          <a className="flex items-center gap-3 text-blue-600" href={`mailto:${testDrive.customerEmail}`}><Mail className="w-5 h-5" />{testDrive.customerEmail}</a>
          <a className="flex items-center gap-3 text-blue-600" href={`tel:${testDrive.customerPhone}`}><Phone className="w-5 h-5" />{testDrive.customerPhone}</a>
        </Card>
        <Card className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Appointment</h2>
          <div className="flex items-center gap-3"><Car className="w-5 h-5 text-gray-400" /><span>{testDrive.vehicle.name}</span></div>
          <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-gray-400" /><span>{testDrive.preferredDate.toISOString().slice(0, 10)}</span></div>
          <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-gray-400" /><span>{testDrive.preferredTime}</span></div>
          <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-gray-400" /><span>{testDrive.location}</span></div>
        </Card>
      </div>
      <TestDriveIdCapture
        testDrive={{
          id: testDrive.id,
          status: testDrive.status,
          idDocumentType: testDrive.idDocumentType,
          idDocumentNumber: testDrive.idDocumentNumber,
          idPhotoUrl: testDrive.idPhotoUrl,
          idVerifiedAt: testDrive.idVerifiedAt?.toISOString() || null,
        }}
        canManage={session.user.permissions.canViewTestDrives}
      />

      {(testDrive.specialRequests || testDrive.internalNotes) && (
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
          {testDrive.specialRequests && <p className="text-gray-700 whitespace-pre-wrap">{testDrive.specialRequests}</p>}
          {testDrive.internalNotes && <p className="mt-3 text-sm text-gray-500 whitespace-pre-wrap">Internal: {testDrive.internalNotes}</p>}
        </Card>
      )}
    </div>
  );
}
