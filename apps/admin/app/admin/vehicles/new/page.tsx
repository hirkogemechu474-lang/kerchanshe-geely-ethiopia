import { requirePermission } from '@/lib/auth/middleware';
import VehicleForm from '@/components/admin/vehicles/VehicleForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewVehiclePage() {
  await requirePermission('canManageVehicles');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/vehicles"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new vehicle to your inventory
          </p>
        </div>
      </div>

      {/* Vehicle Form */}
      <VehicleForm mode="create" />
    </div>
  );
}
