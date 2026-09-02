import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import { notFound } from 'next/navigation';
import VehicleForm from '@/components/admin/vehicles/VehicleForm';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function EditVehiclePage({ params, searchParams }: Props) {
  await requirePermission('canManageVehicles');

  const { id } = await params;
  const { step } = await searchParams;
  const initialStep = step ? parseInt(step, 10) : undefined;

  const client = await serverApiClient();

  let vehicle: any;
  try {
    const { data } = await client.get(`/vehicles/${id}`);
    vehicle = data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      notFound();
    }
    throw error;
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

      <VehicleForm mode="edit" initialData={vehicle} initialStep={initialStep} />
    </div>
  );
}
