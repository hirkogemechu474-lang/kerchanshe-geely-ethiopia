import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import VehicleForm from '@/components/admin/vehicles/VehicleForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: Props) {
  await requirePermission('canManageVehicles');

  const { id } = await params;

  // Fetch vehicle from database
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update {vehicle.name} details
          </p>
        </div>
      </div>

      <VehicleForm mode="edit" initialData={vehicle} />
    </div>
  );
}
